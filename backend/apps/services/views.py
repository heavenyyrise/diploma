from rest_framework import viewsets, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from apps.core.mixins import UserScopedMixin
from .models import Service
from .serializers import ServiceSerializer

class ServiceViewSet(UserScopedMixin, viewsets.ModelViewSet):
    queryset = Service.objects.all()
    serializer_class = ServiceSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_active']
    search_fields = ['name','description']
    ordering_fields = ['name','created_at','price']
    ordering = ['name']

    @action(detail=True, methods=['get'])
    def orders(self, request, pk=None):
        service = self.get_object()
        from apps.orders.serializers import OrderListSerializer
        orders = service.orders.filter(status='in_progress').order_by('-created_at')
        return Response(OrderListSerializer(orders, many=True).data)
