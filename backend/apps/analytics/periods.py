import calendar
import datetime
from datetime import timedelta

from django.utils import timezone


def get_period_bounds(period):
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


def get_calendar_month_bounds(year, month):
    tz = timezone.get_current_timezone()
    start = timezone.make_aware(datetime.datetime(year, month, 1, 0, 0, 0), tz)
    last_day = calendar.monthrange(year, month)[1]
    end = timezone.make_aware(
        datetime.datetime(year, month, last_day, 23, 59, 59, 999999),
        tz,
    )
    return start, end


def get_previous_calendar_month_bounds(year, month):
    if month == 1:
        return get_calendar_month_bounds(year - 1, 12)
    return get_calendar_month_bounds(year, month - 1)


def _query_param(request, key, default=None):
    params = getattr(request, 'query_params', None) or request.GET
    return params.get(key, default)


def resolve_request_period_bounds(request):
    date_from = _query_param(request, 'date_from')
    date_to = _query_param(request, 'date_to')
    year = _query_param(request, 'year')
    month = _query_param(request, 'month')
    period = _query_param(request, 'period', 'month')

    if date_from and date_to:
        try:
            d_from = datetime.date.fromisoformat(date_from)
            d_to = datetime.date.fromisoformat(date_to)
            tz = timezone.get_current_timezone()
            start = timezone.make_aware(datetime.datetime.combine(d_from, datetime.time.min), tz)
            end = timezone.make_aware(datetime.datetime.combine(d_to, datetime.time.max), tz)
            delta = d_to - d_from
            prev_to = d_from - timedelta(days=1)
            prev_from = prev_to - delta
            prev_start = timezone.make_aware(datetime.datetime.combine(prev_from, datetime.time.min), tz)
            prev_end = timezone.make_aware(datetime.datetime.combine(prev_to, datetime.time.max), tz)
            return start, end, prev_start, prev_end
        except (ValueError, TypeError):
            pass

    if year and month:
        try:
            y, m = int(year), int(month)
            if 1 <= m <= 12:
                start, end = get_calendar_month_bounds(y, m)
                prev_start, prev_end = get_previous_calendar_month_bounds(y, m)
                return start, end, prev_start, prev_end
        except (ValueError, TypeError):
            pass

    start, end = get_period_bounds(period)
    prev_start, prev_end = get_previous_period_bounds(period)
    return start, end, prev_start, prev_end
