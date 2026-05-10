from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from .models import Lead
from .serializers import LeadSerializer, LeadPublicSerializer


class LeadPublicCreateView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LeadPublicSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({'message': 'Заявка отправлена!'}, status=status.HTTP_201_CREATED)


class LeadViewSet(viewsets.ModelViewSet):
    queryset = Lead.objects.select_related('service').all()
    serializer_class = LeadSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'service']
    search_fields = ['name', 'contact', 'email', 'description']
    ordering_fields = ['created_at', 'status']
    ordering = ['-created_at']

    @action(detail=True, methods=['post'])
    def accept(self, request, pk=None):
        lead = self.get_object()
        from apps.clients.models import Client
        from apps.orders.models import Order

        client = Client.objects.create(
            name=lead.name,
            email=lead.email,
            notes=f'Контакты: {lead.contact}',
            platform='other',
        )
        order = Order.objects.create(
            title=lead.description[:100] if lead.description else f'Заказ от {lead.name}',
            client=client,
            description=lead.description,
            price=lead.budget or 0,
            deadline=lead.deadline,
            status='in_progress',
            source='manual',
        )
        if lead.service:
            order.services.set([lead.service])

        lead.status = 'accepted'
        lead.save()
        return Response({'message': 'Заявка принята', 'client_id': client.id, 'order_id': order.id})

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        lead = self.get_object()
        lead.status = 'rejected'
        lead.notes = request.data.get('notes', lead.notes)
        lead.save()
        return Response({'message': 'Заявка отклонена'})
