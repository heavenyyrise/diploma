from rest_framework import viewsets, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import Client
from .serializers import ClientSerializer

class ClientViewSet(viewsets.ModelViewSet):
    queryset = Client.objects.all()
    serializer_class = ClientSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['platform','is_regular']
    search_fields = ['name','username','email','phone']
    ordering_fields = ['name','created_at']
    ordering = ['-created_at']

    @action(detail=True, methods=['get'])
    def orders(self, request, pk=None):
        client = self.get_object()
        from apps.orders.serializers import OrderListSerializer
        orders = client.orders.all().order_by('-created_at')
        return Response(OrderListSerializer(orders, many=True).data)
