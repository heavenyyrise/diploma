from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.contrib.auth import get_user_model
from apps.core.mixins import UserScopedMixin
from .models import Lead
from .serializers import LeadSerializer, LeadPublicSerializer

User = get_user_model()


def _get_user_id(request):
    return request.query_params.get('user_id') or request.data.get('user_id')


class LeadPublicCreateView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        user_id = _get_user_id(request)
        if not user_id:
            return Response({'user_id': 'Обязательный параметр'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            owner = User.objects.get(pk=user_id, is_active=True)
        except (User.DoesNotExist, ValueError, TypeError):
            return Response({'user_id': 'Пользователь не найден'}, status=status.HTTP_404_NOT_FOUND)

        serializer = LeadPublicSerializer(data=request.data, context={'request': request, 'owner': owner})
        serializer.is_valid(raise_exception=True)
        serializer.save(user=owner)
        return Response({'message': 'Заявка отправлена!'}, status=status.HTTP_201_CREATED)


class LeadViewSet(UserScopedMixin, viewsets.ModelViewSet):
    queryset = Lead.objects.select_related('lead_source', 'contact_type').prefetch_related('services').all()
    serializer_class = LeadSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'lead_source']
    search_fields = ['name', 'contact_value', 'email', 'description']
    ordering_fields = ['created_at', 'status']
    ordering = ['-created_at']

    @action(detail=True, methods=['post'])
    def accept(self, request, pk=None):
        lead = self.get_object()
        from apps.clients.models import Client, ContactInfo, ContactType
        from apps.orders.models import Order

        client = Client.objects.create(
            user=request.user,
            name=lead.name,
            lead_source=lead.lead_source,
            notes=f'Создан из заявки #{lead.id}',
        )

        if lead.contact_type and lead.contact_value:
            ContactInfo.objects.create(
                client=client,
                contact_type=lead.contact_type,
                value=lead.contact_value,
            )

        if lead.email:
            email_type, _ = ContactType.objects.get_or_create(
                name='Email', defaults={'order': 10}
            )
            ContactInfo.objects.create(
                client=client,
                contact_type=email_type,
                value=lead.email,
            )

        first_service = lead.services.first()
        title = first_service.name if first_service else f'Заказ от {lead.name}'

        order = Order.objects.create(
            user=request.user,
            title=title,
            client=client,
            description=lead.description,
            price=lead.budget or 0,
            deadline=lead.deadline,
            status='in_progress',
            source='manual',
        )
        order.services.set(lead.services.all())

        from apps.orders.services import log_order_created
        log_order_created(order, request.user)

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
