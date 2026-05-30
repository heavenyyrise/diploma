from datetime import datetime, time

from django.utils import timezone


def is_retrospective_deadline(deadline, created_at=None):
    if not deadline:
        return False
    ref = created_at.date() if created_at else timezone.localdate()
    return deadline < ref


def validate_order_status_for_deadline(status, deadline, created_at=None):
    if is_retrospective_deadline(deadline, created_at) and status != 'completed':
        return 'Для заказа с дедлайном раньше даты создания доступен только статус «Завершён».'
    return None


def resolve_completed_at(deadline):
    today = timezone.localdate()
    if deadline and deadline < today:
        naive = datetime.combine(deadline, time(12, 0))
        return timezone.make_aware(naive, timezone.get_current_timezone())
    return timezone.now()
