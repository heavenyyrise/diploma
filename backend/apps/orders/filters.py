import django_filters
from .models import Order

class OrderFilter(django_filters.FilterSet):
    deadline_from = django_filters.DateFilter(field_name='deadline', lookup_expr='gte')
    deadline_to = django_filters.DateFilter(field_name='deadline', lookup_expr='lte')
    created_from = django_filters.DateFilter(field_name='created_at', lookup_expr='gte')
    created_to = django_filters.DateFilter(field_name='created_at', lookup_expr='lte')
    price_min = django_filters.NumberFilter(field_name='price', lookup_expr='gte')
    price_max = django_filters.NumberFilter(field_name='price', lookup_expr='lte')

    class Meta:
        model = Order
        fields = ['status', 'platform', 'client', 'source']
