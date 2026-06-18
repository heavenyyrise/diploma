from django.db.models import Count, F, Q, Sum
from django.db.models.functions import TruncMonth
from django.utils import timezone
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.clients.models import Client
from apps.orders.models import Order
from apps.services.models import Service

from .periods import resolve_request_period_bounds

LABEL_NEW = 'Новые клиенты'
LABEL_REPEAT = 'Повторные'
LABEL_NO_CLIENT = 'Без клиента'
LABEL_NO_SOURCE = 'Без источника'


class IncomeByLeadSourceView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = Order.objects.filter(user=request.user, status='completed')
        data = (
            qs.values('client__lead_source__id', 'client__lead_source__name')
            .annotate(total=Sum('price'), count=Count('id'))
            .order_by('-total')
        )
        result = []
        for item in data:
            result.append({
                'lead_source_id': item['client__lead_source__id'],
                'label': item['client__lead_source__name'] or LABEL_NO_SOURCE,
                'total': float(item['total'] or 0),
                'count': item['count'],
            })
        return Response(result)


class IncomeByClientTypeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        start, end, _, _ = resolve_request_period_bounds(request)

        period_orders = Order.objects.filter(
            user=request.user,
            status='completed',
            client__isnull=False,
            completed_at__isnull=False,
            completed_at__gte=start,
            completed_at__lte=end,
        ).annotate(
            prior_completed=Count(
                'client__orders',
                filter=Q(
                    client__orders__user=request.user,
                    client__orders__status='completed',
                    client__orders__completed_at__lt=F('completed_at'),
                ),
            ),
        ).values('price', 'prior_completed')

        totals = {LABEL_NEW: 0.0, LABEL_REPEAT: 0.0}
        counts = {LABEL_NEW: 0, LABEL_REPEAT: 0}
        for row in period_orders:
            price = float(row['price'] or 0)
            if row['prior_completed'] == 0:
                totals[LABEL_NEW] += price
                counts[LABEL_NEW] += 1
            else:
                totals[LABEL_REPEAT] += price
                counts[LABEL_REPEAT] += 1

        no_client = Order.objects.filter(
            user=request.user,
            status='completed',
            client__isnull=True,
            completed_at__gte=start,
            completed_at__lte=end,
        ).aggregate(total=Sum('price'), count=Count('id'))

        result = [
            {
                'label': LABEL_NEW,
                'total': totals[LABEL_NEW],
                'count': counts[LABEL_NEW],
            },
            {
                'label': LABEL_REPEAT,
                'total': totals[LABEL_REPEAT],
                'count': counts[LABEL_REPEAT],
            },
        ]
        if no_client['count']:
            result.append({
                'label': LABEL_NO_CLIENT,
                'total': float(no_client['total'] or 0),
                'count': no_client['count'],
            })
        return Response(result)


class NewClientsByLeadSourceView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        start, end, _, _ = resolve_request_period_bounds(request)

        data = (
            Client.objects.filter(
                user=request.user,
                created_at__gte=start,
                created_at__lte=end,
            )
            .values('lead_source__id', 'lead_source__name')
            .annotate(count=Count('id'))
            .order_by('-count')
        )
        return Response([
            {
                'lead_source_id': item['lead_source__id'],
                'label': item['lead_source__name'] or LABEL_NO_SOURCE,
                'count': item['count'],
            }
            for item in data
        ])


class IncomeByMonthView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        year = request.query_params.get('year', timezone.now().year)
        data = (
            Order.objects.filter(user=request.user, status='completed', completed_at__year=year)
            .annotate(month=TruncMonth('completed_at'))
            .values('month')
            .annotate(total=Sum('price'), count=Count('id'))
            .order_by('month')
        )
        months = ['', 'Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек']
        monthly = {i: {'total': 0, 'count': 0} for i in range(1, 13)}
        for item in data:
            m = item['month'].month
            monthly[m] = {'total': float(item['total'] or 0), 'count': item['count']}
        return Response([
            {'month': i, 'label': months[i], 'total': monthly[i]['total'], 'count': monthly[i]['count']}
            for i in range(1, 13)
        ])


class IncomeByServiceView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        start, end, _, _ = resolve_request_period_bounds(request)

        result = []
        for service in Service.objects.filter(user=request.user):
            orders_qs = service.orders.filter(
                status='completed',
                completed_at__gte=start,
                completed_at__lte=end,
            )
            total = orders_qs.aggregate(t=Sum('price'))['t'] or 0
            count = orders_qs.count()
            if total > 0:
                result.append({
                    'service': service.name,
                    'service_id': service.id,
                    'total': float(total),
                    'count': count,
                })

        no_service_qs = Order.objects.filter(
            user=request.user,
            status='completed',
            services__isnull=True,
            completed_at__gte=start,
            completed_at__lte=end,
        )
        no_service_total = no_service_qs.aggregate(t=Sum('price'))['t'] or 0
        if no_service_total > 0:
            result.append({
                'service': 'Без услуги',
                'service_id': None,
                'total': float(no_service_total),
                'count': no_service_qs.count(),
            })

        result.sort(key=lambda x: x['total'], reverse=True)
        return Response(result)


class IncomeSummaryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        start, end, prev_start, prev_end = resolve_request_period_bounds(request)

        base_qs = Order.objects.filter(user=request.user, status='completed')
        qs = base_qs.filter(completed_at__gte=start, completed_at__lte=end)
        prev_agg = base_qs.filter(
            completed_at__gte=prev_start,
            completed_at__lte=prev_end,
        ).aggregate(total=Sum('price'))
        prev_total = float(prev_agg['total'] or 0)

        agg = qs.aggregate(total=Sum('price'), count=Count('id'))
        current_total = float(agg['total'] or 0)
        diff = current_total - prev_total

        if prev_total > 0:
            diff_pct = round(diff / prev_total * 100, 1)
        elif current_total > 0:
            diff_pct = 100.0
        else:
            diff_pct = 0.0

        return Response({
            'total': current_total,
            'count': agg['count'] or 0,
            'prev_total': prev_total,
            'diff': diff,
            'diff_pct': diff_pct,
        })


class AvailableYearsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        years = Order.objects.filter(
            user=request.user, status='completed',
        ).values_list('completed_at__year', flat=True).distinct().order_by('-completed_at__year')
        return Response(list(set(y for y in years if y)))
