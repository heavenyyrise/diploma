import mimetypes

from django.http import FileResponse
from django.shortcuts import get_object_or_404
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.response import Response
from apps.core.mixins import UserScopedMixin
from .models import Order, OrderAttachment
from .serializers import (
    OrderSerializer, OrderListSerializer, OrderChangeLogSerializer,
    OrderAttachmentSerializer, OrderAttachmentUploadSerializer,
)
from .filters import OrderFilter


class OrderViewSet(UserScopedMixin, viewsets.ModelViewSet):
    queryset = Order.objects.select_related('client__lead_source').prefetch_related('client__contacts__contact_type').all()
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = OrderFilter
    search_fields = ['title', 'description', 'client__name']
    ordering_fields = ['created_at', 'deadline', 'price', 'status']
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.action == 'list':
            return OrderListSerializer
        return OrderSerializer

    @action(detail=False, methods=['get'])
    def stats(self, request):
        from django.db.models import Sum
        from django.utils import timezone
        qs = Order.objects.filter(user=request.user)
        now = timezone.now()
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        return Response({
            'total': qs.count(),
            'in_progress': qs.filter(status='in_progress').count(),
            'completed': qs.filter(status='completed').count(),
            'frozen': qs.filter(status='frozen').count(),
            'cancelled': qs.filter(status='cancelled').count(),
            'month_income': float(qs.filter(status='completed', completed_at__gte=month_start).aggregate(t=Sum('price'))['t'] or 0),
            'total_income': float(qs.filter(status='completed').aggregate(t=Sum('price'))['t'] or 0),
            'overdue': qs.filter(status='in_progress', deadline__lt=now.date()).count(),
        })

    @action(detail=False, methods=['get'])
    def recent(self, request):
        orders = Order.objects.filter(user=request.user).select_related('client').prefetch_related('services').order_by('-created_at')[:10]
        return Response(OrderListSerializer(orders, many=True).data)

    @action(detail=True, methods=['get'])
    def changelog(self, request, pk=None):
        order = self.get_object()
        logs = order.change_logs.select_related('changed_by').all()
        return Response(OrderChangeLogSerializer(logs, many=True).data)

    @action(detail=True, methods=['get', 'post'], url_path='attachments', parser_classes=[MultiPartParser, FormParser, JSONParser])
    def attachments(self, request, pk=None):
        order = self.get_object()
        if request.method == 'GET':
            qs = order.attachments.select_related('uploaded_by').all()
            kind = request.query_params.get('kind')
            if kind in ('document', 'deliverable'):
                qs = qs.filter(kind=kind)
            return Response(OrderAttachmentSerializer(qs, many=True, context={'request': request}).data)
        upload_serializer = OrderAttachmentUploadSerializer(data=request.data)
        upload_serializer.is_valid(raise_exception=True)
        uploaded_file = upload_serializer.validated_data['file']
        kind = upload_serializer.validated_data.get('kind', 'document')
        attachment = OrderAttachment.objects.create(
            order=order,
            kind=kind,
            file=uploaded_file,
            original_name=uploaded_file.name,
            file_size=uploaded_file.size,
            uploaded_by=request.user,
        )
        return Response(
            OrderAttachmentSerializer(attachment, context={'request': request}).data,
            status=status.HTTP_201_CREATED,
        )

    @action(
        detail=True,
        methods=['get'],
        url_path=r'attachments/(?P<attachment_pk>[^/.]+)/file',
    )
    def download_attachment(self, request, pk=None, attachment_pk=None):
        order = self.get_object()
        attachment = get_object_or_404(OrderAttachment, pk=attachment_pk, order=order)

        if not attachment.file:
            return Response(status=status.HTTP_404_NOT_FOUND)

        content_type, _ = mimetypes.guess_type(attachment.original_name)
        if not content_type:
            content_type = 'application/octet-stream'

        inline = request.query_params.get('inline') == '1'
        response = FileResponse(
            attachment.file.open('rb'),
            content_type=content_type,
            as_attachment=not inline,
            filename=attachment.original_name,
        )
        return response

    @action(detail=True, methods=['delete'], url_path=r'attachments/(?P<attachment_pk>[^/.]+)')
    def delete_attachment(self, request, pk=None, attachment_pk=None):
        order = self.get_object()
        attachment = get_object_or_404(OrderAttachment, pk=attachment_pk, order=order)
        attachment.file.delete(save=False)
        attachment.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
