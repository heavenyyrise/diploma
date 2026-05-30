from datetime import timedelta

from django.utils import timezone


def get_period_bounds(period):
    """Return (start, end) datetimes for month, quarter, or year period."""
    now = timezone.now()
    if period == 'year':
        start = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
    elif period == 'quarter':
        quarter_start_month = ((now.month - 1) // 3) * 3 + 1
        start = now.replace(
            month=quarter_start_month, day=1,
            hour=0, minute=0, second=0, microsecond=0,
        )
    else:
        start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    return start, now


def get_previous_period_bounds(period):
    """Return (start, end) datetimes for the full previous calendar period."""
    current_start, _ = get_period_bounds(period)
    prev_end = current_start - timedelta(microseconds=1)

    if period == 'year':
        prev_start = current_start.replace(year=current_start.year - 1)
    elif period == 'quarter':
        prev_start_month = current_start.month - 3
        if prev_start_month <= 0:
            prev_start = current_start.replace(year=current_start.year - 1, month=prev_start_month + 12)
        else:
            prev_start = current_start.replace(month=prev_start_month)
    else:
        if current_start.month == 1:
            prev_start = current_start.replace(year=current_start.year - 1, month=12)
        else:
            prev_start = current_start.replace(month=current_start.month - 1)

    return prev_start, prev_end
