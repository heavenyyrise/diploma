from rest_framework import viewsets, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import Client, ContactInfo, ContactType, LeadSource
from .serializers import (
    ClientSerializer, ClientShortSerializer,
    ContactTypeSerializer, LeadSourceSerializer, ContactInfoSerializer
)


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


class ClientViewSet(viewsets.ModelViewSet):
    queryset = Client.objects.prefetch_related('contacts__contact_type').select_related('lead_source').all()
    serializer_class = ClientSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_regular', 'lead_source']
    search_fields = ['name', 'contacts__value']
    ordering_fields = ['name', 'created_at']
    ordering = ['-created_at']

    def create(self, request, *args, **kwargs):
        contacts_data = request.data.pop('contacts', [])
        # Resolve contact_type ids
        parsed_contacts = []
        for c in contacts_data:
            if c.get('contact_type') and c.get('value'):
                parsed_contacts.append({
                    'contact_type_id': c['contact_type'],
                    'value': c['value'],
                })
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.context['contacts'] = [
            {'contact_type_id': c['contact_type_id'], 'value': c['value']}
            for c in parsed_contacts
        ]
        client = serializer.save()
        return Response(ClientSerializer(client).data, status=201)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        contacts_data = request.data.pop('contacts', None)
        parsed_contacts = None
        if contacts_data is not None:
            parsed_contacts = []
            for c in contacts_data:
                if c.get('contact_type') and c.get('value'):
                    parsed_contacts.append({
                        'contact_type_id': c['contact_type'],
                        'value': c['value'],
                    })
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
