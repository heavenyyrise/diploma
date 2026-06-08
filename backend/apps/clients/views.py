from rest_framework import viewsets, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Sum, Q, Value, FloatField
from django.db.models.functions import Coalesce
from apps.core.mixins import UserScopedMixin
from .models import Client, ContactInfo, ContactType, LeadSource
from .serializers import (
    ClientSerializer, ClientShortSerializer,
    ContactTypeSerializer, LeadSourceSerializer, ContactInfoSerializer
)
from .validators import validate_contact_value, normalize_contact_value


def _parse_and_validate_contacts(contacts_data):
    parsed_contacts = []
    errors = []

    for index, c in enumerate(contacts_data or []):
        contact_type_id = c.get('contact_type')
        value = (c.get('value') or '').strip()
        if not contact_type_id or not value:
            continue

        try:
            contact_type = ContactType.objects.get(pk=contact_type_id)
        except ContactType.DoesNotExist:
            errors.append({'index': index, 'value': 'Неизвестный тип контакта.'})
            continue

        error = validate_contact_value(value, contact_type.name)
        if error:
            errors.append({'index': index, 'value': error})
            continue

        parsed_contacts.append({
            'contact_type_id': contact_type_id,
            'value': normalize_contact_value(value, contact_type.name),
        })

    if errors:
        raise ValidationError({'contacts': errors})

    return parsed_contacts


class LeadSourceViewSet(viewsets.ModelViewSet):
    queryset = LeadSource.objects.all()
    serializer_class = LeadSourceSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['is_active']
    search_fields = ['name']
    ordering = ['order', 'name']


class ContactTypeViewSet(viewsets.ModelViewSet):
    queryset = ContactType.objects.all()
    serializer_class = ContactTypeSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['is_active']
    search_fields = ['name']
    ordering = ['order', 'name']


class ClientViewSet(UserScopedMixin, viewsets.ModelViewSet):
    queryset = Client.objects.prefetch_related('contacts__contact_type').select_related('lead_source').all()
    serializer_class = ClientSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_regular', 'lead_source']
    search_fields = ['name', 'contacts__value']
    ordering_fields = ['name', 'created_at', 'income_total']
    ordering = ['-created_at']

    def get_queryset(self):
        qs = super().get_queryset()
        return qs.annotate(
            income_total=Coalesce(
                Sum('orders__price', filter=Q(orders__status='completed')),
                Value(0.0),
                output_field=FloatField(),
            )
        )

    def create(self, request, *args, **kwargs):
        contacts_data = request.data.pop('contacts', [])
        parsed_contacts = _parse_and_validate_contacts(contacts_data)
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.context['contacts'] = parsed_contacts
        client = serializer.save(user=request.user)
        return Response(ClientSerializer(client).data, status=201)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        contacts_data = request.data.pop('contacts', None)
        parsed_contacts = None
        if contacts_data is not None:
            parsed_contacts = _parse_and_validate_contacts(contacts_data)
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        serializer.context['contacts'] = parsed_contacts
        client = serializer.save()
        return Response(ClientSerializer(client).data)

    @action(detail=True, methods=['get'])
    def orders(self, request, pk=None):
        client = self.get_object()
        from apps.orders.serializers import OrderListSerializer
        orders = client.orders.all().order_by('-created_at')
        return Response(OrderListSerializer(orders, many=True).data)
