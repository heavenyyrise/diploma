from rest_framework import serializers
from .models import Lead
from apps.services.serializers import ServiceShortSerializer
from apps.clients.serializers import LeadSourceSerializer, ContactTypeSerializer


class LeadPublicSerializer(serializers.ModelSerializer):
    class Meta:
        model = Lead
        fields = ['id', 'name', 'contact_type', 'contact_value', 'email',
                  'lead_source', 'service', 'description', 'budget', 'deadline']


class LeadSerializer(serializers.ModelSerializer):
    service_detail = ServiceShortSerializer(source='service', read_only=True)
    lead_source_detail = LeadSourceSerializer(source='lead_source', read_only=True)
    contact_type_detail = ContactTypeSerializer(source='contact_type', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    contact_display = serializers.ReadOnlyField()

    class Meta:
        model = Lead
        fields = [
            'id', 'name',
            'contact_type', 'contact_type_detail', 'contact_value',
            'email',
            'lead_source', 'lead_source_detail',
            'service', 'service_detail',
            'description', 'budget', 'deadline',
            'status', 'status_display',
            'notes', 'created_at', 'contact_display',
        ]
        read_only_fields = ['id', 'created_at']
