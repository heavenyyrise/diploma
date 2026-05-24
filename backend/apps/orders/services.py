from decimal import Decimal

from .models import Order, OrderChangeLog

FIELD_LABELS = dict(OrderChangeLog.FIELD_CHOICES)
STATUS_LABELS = dict(Order.STATUS_CHOICES)
TRACKED_FIELDS = ['price', 'status', 'title', 'description', 'deadline', 'client', 'services']


def build_order_snapshot(order):
    return {
        'title': order.title or '',
        'description': order.description or '',
        'status': order.status,
        'price': order.price,
        'deadline': order.deadline,
        'client_name': order.client.name if order.client_id else None,
        'services': sorted(order.services.values_list('name', flat=True)),
    }


def _format_field_value(field, snapshot):
    if field == 'price':
        val = snapshot.get('price')
        if val is None:
            return '—'
        return f'{Decimal(val):.2f} BYN'
    if field == 'status':
        val = snapshot.get('status')
        return STATUS_LABELS.get(val, val or '—')
    if field == 'deadline':
        val = snapshot.get('deadline')
        if not val:
            return '—'
        return val.isoformat() if hasattr(val, 'isoformat') else str(val)
    if field == 'client':
        return snapshot.get('client_name') or '—'
    if field == 'services':
        names = snapshot.get('services') or []
        return ', '.join(names) if names else '—'
    val = snapshot.get(field, '')
    return str(val) if val else '—'


def log_order_created(order, user):
    OrderChangeLog.objects.create(
        order=order,
        field='created',
        old_value='',
        new_value='Заказ создан',
        changed_by=user,
    )


def log_order_changes(order, old_snapshot, new_snapshot, user):
    for field in TRACKED_FIELDS:
        if field == 'description':
            if (old_snapshot.get('description') or '') == (new_snapshot.get('description') or ''):
                continue
            OrderChangeLog.objects.create(
                order=order,
                field='description',
                old_value='',
                new_value='Изменено ТЗ',
                changed_by=user,
            )
            continue
        old_val = _format_field_value(field, old_snapshot)
        new_val = _format_field_value(field, new_snapshot)
        if old_val == new_val:
            continue
        OrderChangeLog.objects.create(
            order=order,
            field=field,
            old_value=old_val,
            new_value=new_val,
            changed_by=user,
        )
