from decimal import Decimal

from django.core.exceptions import ValidationError
from apps.core.email import send_raw_email
from apps.orders.models import Order
from .models import SentEmail

STATUS_LABELS = dict(Order.STATUS_CHOICES)


def build_context(client=None, order=None):
    return {
        'client_name': client.name if client else (order.client.name if order and order.client_id else ''),
        'order_title': order.title if order else '',
        'order_price': f'{Decimal(order.price):.2f} BYN' if order else '',
        'order_status': STATUS_LABELS.get(order.status, order.status) if order else '',
        'deadline': order.deadline.strftime('%d.%m.%Y') if order and order.deadline else '—',
    }


def render_placeholders(text, context):
    if not text:
        return text
    result = text
    for key, value in context.items():
        result = result.replace('{' + key + '}', str(value))
    return result


def send_client_email(user, *, to_email, subject, body, order=None, client=None, attachments=None):
    if not user.reply_to_email:
        raise ValidationError('Укажите email для ответов в настройках почты.')

    ctx = build_context(client=client, order=order)
    rendered_subject = render_placeholders(subject, ctx)
    rendered_body = render_placeholders(body, ctx)

    status = 'sent'
    error_message = ''
    try:
        send_raw_email(
            to=to_email,
            subject=rendered_subject,
            body=rendered_body,
            reply_to=user.reply_to_email,
            attachments=attachments,
        )
    except Exception as exc:
        status = 'failed'
        error_message = str(exc)

    return SentEmail.objects.create(
        user=user,
        to_email=to_email,
        subject=rendered_subject,
        body=rendered_body,
        order=order,
        client=client,
        status=status,
        error_message=error_message,
    )
