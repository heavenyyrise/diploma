from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from apps.core.mixins import UserScopedMixin
from apps.clients.models import Client
from apps.orders.models import Order, OrderAttachment
from .models import EmailTemplate, SentEmail
from .serializers import EmailTemplateSerializer, SendEmailSerializer, SentEmailSerializer
from .services import send_client_email
from .validators import validate_attachment, attachment_from_order_file, MAX_EMAIL_ATTACHMENTS


class EmailTemplateViewSet(UserScopedMixin, viewsets.ModelViewSet):
    queryset = EmailTemplate.objects.all()
    serializer_class = EmailTemplateSerializer


class SendEmailView(APIView):
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def post(self, request):
        payload = request.data.copy()
        if hasattr(request.data, 'getlist'):
            id_list = request.data.getlist('order_attachment_ids')
            if id_list:
                payload.setlist('order_attachment_ids', id_list)
        serializer = SendEmailSerializer(data=payload)
        serializer.is_valid(raise_exception=True)
        validated = serializer.validated_data

        order = None
        client = None
        if validated.get('order_id'):
            order = Order.objects.filter(user=request.user, pk=validated['order_id']).first()
            if not order:
                raise ValidationError({'order_id': 'Заказ не найден.'})
            if order.client_id and not validated.get('client_id'):
                client = order.client
        if validated.get('client_id'):
            client = Client.objects.filter(user=request.user, pk=validated['client_id']).first()
            if not client:
                raise ValidationError({'client_id': 'Клиент не найден.'})

        subject = validated['subject']
        body = validated['body']
        if validated.get('template_id'):
            template = EmailTemplate.objects.filter(user=request.user, pk=validated['template_id']).first()
            if not template:
                raise ValidationError({'template_id': 'Шаблон не найден.'})
            if not subject:
                subject = template.subject
            if not body:
                body = template.body

        attachments = []
        for f in request.FILES.getlist('attachments'):
            try:
                attachments.append(validate_attachment(f))
            except ValueError as exc:
                raise ValidationError({'attachments': str(exc)})

        order_attachment_ids = validated.get('order_attachment_ids') or []
        if order_attachment_ids and not order:
            raise ValidationError({'order_attachment_ids': 'Укажите заказ для прикрепления файлов из заказа.'})

        seen_ids = set()
        for att_id in order_attachment_ids:
            if att_id in seen_ids:
                continue
            seen_ids.add(att_id)
            order_att = OrderAttachment.objects.filter(
                pk=att_id,
                kind='deliverable',
                order=order,
                order__user=request.user,
            ).first()
            if not order_att:
                raise ValidationError({'order_attachment_ids': f'Финальный файл #{att_id} не найден.'})
            try:
                attachments.append(attachment_from_order_file(order_att.original_name, order_att.file))
            except ValueError as exc:
                raise ValidationError({'order_attachment_ids': str(exc)})

        if len(attachments) > MAX_EMAIL_ATTACHMENTS:
            raise ValidationError({'attachments': f'Максимум {MAX_EMAIL_ATTACHMENTS} вложений в одном письме.'})

        try:
            sent = send_client_email(
                request.user,
                to_email=validated['to_email'],
                subject=subject,
                body=body,
                order=order,
                client=client,
                attachments=attachments,
            )
        except DjangoValidationError as exc:
            raise ValidationError({'detail': exc.messages[0] if exc.messages else str(exc)})

        return Response(
            SentEmailSerializer(sent).data,
            status=status.HTTP_201_CREATED if sent.status == 'sent' else status.HTTP_400_BAD_REQUEST,
        )


class SentEmailListView(APIView):
    def get(self, request):
        qs = SentEmail.objects.filter(user=request.user).select_related('order', 'client')
        order_id = request.query_params.get('order_id')
        client_id = request.query_params.get('client_id')
        if order_id:
            qs = qs.filter(order_id=order_id)
        if client_id:
            qs = qs.filter(client_id=client_id)
        return Response(SentEmailSerializer(qs[:50], many=True).data)
