from rest_framework import serializers
from .models import Lead
from apps.services.serializers import ServiceShortSerializer
from apps.clients.serializers import LeadSourceSerializer, ContactTypeSerializer


class LeadPublicSerializer(serializers.ModelSerializer):
    services = serializers.PrimaryKeyRelatedField(
        queryset=__import__('apps.services.models', fromlist=['Service']).Service.objects.all(),
        many=True, required=False
    )

    class Meta:
        model = Lead
        fields = [
            'id', 'name', 'contact_type', 'contact_value', 'email',
            'lead_source', 'services', 'description', 'budget', 'deadline',
        ]

    def create(self, validated_data):
        services = validated_data.pop('services', [])
        lead = Lead.objects.create(**validated_data)
        if services:
            lead.services.set(services)
        return lead


class LeadSerializer(serializers.ModelSerializer):
    services_detail = ServiceShortSerializer(source='services', many=True, read_only=True)
    services = serializers.PrimaryKeyRelatedField(
        queryset=__import__('apps.services.models', fromlist=['Service']).Service.objects.all(),
        many=True, required=False
    )
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
            'services', 'services_detail',
            'description', 'budget', 'deadline',
            'status', 'status_display',
            'notes', 'created_at', 'contact_display',
        ]
        read_only_fields = ['id', 'created_at']

    def update(self, instance, validated_data):
        services = validated_data.pop('services', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if services is not None:
            instance.services.set(services)
        return instance
