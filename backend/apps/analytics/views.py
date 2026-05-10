from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum, Count
from django.db.models.functions import TruncMonth
from django.utils import timezone
from apps.orders.models import Order
import datetime


class IncomeByPlatformView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        period = request.query_params.get('period', 'all')
        qs = Order.objects.filter(status='completed')
        if period == 'month':
            now = timezone.now()
            qs = qs.filter(completed_at__month=now.month, completed_at__year=now.year)
        elif period == 'year':
            qs = qs.filter(completed_at__year=timezone.now().year)

        data = qs.values('platform').annotate(total=Sum('price'), count=Count('id')).order_by('-total')
        LABELS = {'instagram':'Instagram','telegram':'Telegram','kwork':'Kwork','other':'Другое'}
        return Response([{
            'platform': i['platform'],
            'label': LABELS.get(i['platform'], i['platform']),
            'total': float(i['total'] or 0),
            'count': i['count'],
        } for i in data])


class IncomeByMonthView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        year = request.query_params.get('year', timezone.now().year)
        data = (
            Order.objects.filter(status='completed', completed_at__year=year)
            .annotate(month=TruncMonth('completed_at'))
            .values('month')
            .annotate(total=Sum('price'), count=Count('id'))
            .order_by('month')
        )
        MONTHS = ['','Янв','Фев','Мар','Апр','Май','Июн','Июл','Авг','Сен','Окт','Ноя','Дек']
        monthly = {i: {'total': 0, 'count': 0} for i in range(1, 13)}
        for item in data:
            m = item['month'].month
            monthly[m] = {'total': float(item['total'] or 0), 'count': item['count']}
        return Response([{'month': i, 'label': MONTHS[i], 'total': monthly[i]['total'], 'count': monthly[i]['count']} for i in range(1, 13)])


class IncomeByServiceView(APIView):
    """Доходы по услугам — адаптирован под ManyToMany"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from apps.services.models import Service
        result = []
        for service in Service.objects.all():
            total = service.orders.filter(status='completed').aggregate(t=Sum('price'))['t'] or 0
            count = service.orders.filter(status='completed').count()
            if total > 0:
                result.append({'service': service.name, 'total': float(total), 'count': count})

        # Заказы без услуг
        no_service_total = Order.objects.filter(status='completed', services__isnull=True).aggregate(t=Sum('price'))['t'] or 0
        if no_service_total > 0:
            result.append({'service': 'Без услуги', 'total': float(no_service_total), 'count': 0})

        result.sort(key=lambda x: x['total'], reverse=True)
        return Response(result)


class IncomeSummaryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        date_from = request.query_params.get('date_from')
        date_to = request.query_params.get('date_to')
        qs = Order.objects.filter(status='completed')
        if date_from:
            qs = qs.filter(completed_at__date__gte=date_from)
        if date_to:
            qs = qs.filter(completed_at__date__lte=date_to)
        agg = qs.aggregate(total=Sum('price'), count=Count('id'))

        prev_total = 0
        if date_from and date_to:
            try:
                d_from = datetime.date.fromisoformat(date_from)
                d_to = datetime.date.fromisoformat(date_to)
                delta = d_to - d_from
                prev_from = d_from - delta - datetime.timedelta(days=1)
                prev_to = d_from - datetime.timedelta(days=1)
                prev = Order.objects.filter(status='completed', completed_at__date__gte=prev_from, completed_at__date__lte=prev_to).aggregate(total=Sum('price'))
                prev_total = float(prev['total'] or 0)
            except Exception:
                pass

        current_total = float(agg['total'] or 0)
        diff = current_total - prev_total
        diff_pct = round((diff / prev_total * 100) if prev_total > 0 else 0, 1)
        return Response({'total': current_total, 'count': agg['count'] or 0, 'prev_total': prev_total, 'diff': diff, 'diff_pct': diff_pct})


class AvailableYearsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        years = Order.objects.filter(status='completed').values_list('completed_at__year', flat=True).distinct().order_by('-completed_at__year')
        return Response(list(set(y for y in years if y)))
