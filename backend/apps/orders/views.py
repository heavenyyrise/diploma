from rest_framework import viewsets, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import Order
from .serializers import OrderSerializer, OrderListSerializer
from .filters import OrderFilter


class OrderViewSet(viewsets.ModelViewSet):
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
        qs = Order.objects.all()
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
        orders = Order.objects.select_related('client').prefetch_related('services').order_by('-created_at')[:10]
        return Response(OrderListSerializer(orders, many=True).data)
