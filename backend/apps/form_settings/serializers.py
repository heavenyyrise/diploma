from rest_framework import serializers
from .models import FormSettings
from apps.services.serializers import ServiceShortSerializer
from apps.clients.serializers import LeadSourceSerializer, ContactTypeSerializer


class FormSettingsSerializer(serializers.ModelSerializer):
    services_detail = ServiceShortSerializer(source='services', many=True, read_only=True)

    class Meta:
        model = FormSettings
        fields = [
            'id', 'title', 'subtitle', 'button_text', 'success_message',
            'show_email', 'show_budget', 'show_deadline', 'show_description',
            'show_service', 'show_lead_source',
            'services', 'services_detail',
        ]


class FormSettingsPublicSerializer(serializers.ModelSerializer):
    services = serializers.SerializerMethodField()
    lead_sources = serializers.SerializerMethodField()
    contact_types = serializers.SerializerMethodField()

    class Meta:
        model = FormSettings
        fields = [
            'title', 'subtitle', 'button_text', 'success_message',
            'show_email', 'show_budget', 'show_deadline', 'show_description',
            'show_service', 'show_lead_source',
            'services', 'lead_sources', 'contact_types',
        ]

    def get_services(self, obj):
        from apps.services.models import Service
        qs = obj.services.filter(is_active=True) if obj.services.exists() else Service.objects.none()
        return ServiceShortSerializer(qs, many=True).data

    def get_lead_sources(self, obj):
        from apps.clients.models import LeadSource
        return LeadSourceSerializer(LeadSource.objects.filter(is_active=True), many=True).data

    def get_contact_types(self, obj):
        from apps.clients.models import ContactType
        return ContactTypeSerializer(ContactType.objects.filter(is_active=True), many=True).data
