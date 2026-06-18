from rest_framework import serializers
from .models import FormSettings
from apps.services.models import Service
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

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            self.fields['services'].queryset = Service.objects.filter(
                user=request.user, is_active=True,
            )

    def validate_services(self, services):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return services
        for service in services:
            if service.user_id != request.user.id:
                raise serializers.ValidationError('Услуга не принадлежит этому пользователю')
        return services


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
        return LeadSourceSerializer(
            LeadSource.objects.filter(user=obj.user, is_active=True),
            many=True,
        ).data

    def get_contact_types(self, obj):
        from apps.clients.models import ContactType
        return ContactTypeSerializer(
            ContactType.objects.filter(user=obj.user, is_active=True),
            many=True,
        ).data
