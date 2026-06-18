from rest_framework import serializers
from .models import Lead
from apps.services.models import Service
from apps.services.serializers import ServiceShortSerializer
from apps.clients.serializers import LeadSourceSerializer, ContactTypeSerializer
from apps.clients.models import LeadSource, ContactType
from apps.clients.validators import validate_client_name, validate_contact_value, normalize_contact_value


class LeadPublicSerializer(serializers.ModelSerializer):
    services = serializers.PrimaryKeyRelatedField(
        queryset=Service.objects.all(),
        many=True, required=False,
    )

    class Meta:
        model = Lead
        fields = [
            'id', 'name', 'contact_type', 'contact_value', 'email',
            'lead_source', 'services', 'description', 'budget', 'deadline',
        ]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        owner = self.context.get('owner')
        if owner:
            self.fields['services'].queryset = Service.objects.filter(user=owner, is_active=True)
            self.fields['contact_type'].queryset = ContactType.objects.filter(user=owner, is_active=True)
            self.fields['lead_source'].queryset = LeadSource.objects.filter(user=owner, is_active=True)

    def validate_services(self, services):
        owner = self.context.get('owner')
        if not owner:
            return services
        for service in services:
            if service.user_id != owner.id:
                raise serializers.ValidationError('Услуга не принадлежит этому пользователю')
        return services

    def validate_name(self, value):
        error = validate_client_name(value)
        if error:
            raise serializers.ValidationError(error)
        return value.strip()

    def validate(self, attrs):
        owner = self.context.get('owner')
        contact_type = attrs.get('contact_type')
        lead_source = attrs.get('lead_source')
        if owner and contact_type and contact_type.user_id != owner.id:
            raise serializers.ValidationError({'contact_type': 'Тип контакта не принадлежит этому пользователю.'})
        if owner and lead_source and lead_source.user_id != owner.id:
            raise serializers.ValidationError({'lead_source': 'Источник не принадлежит этому пользователю.'})

        contact_value = (attrs.get('contact_value') or '').strip()
        if contact_type and contact_value:
            error = validate_contact_value(contact_value, contact_type.name)
            if error:
                raise serializers.ValidationError({'contact_value': error})
            attrs['contact_value'] = normalize_contact_value(contact_value, contact_type.name)
        return attrs

    def create(self, validated_data):
        services = validated_data.pop('services', [])
        lead = Lead.objects.create(**validated_data)
        if services:
            lead.services.set(services)
        return lead


class LeadSerializer(serializers.ModelSerializer):
    services_detail = ServiceShortSerializer(source='services', many=True, read_only=True)
    services = serializers.PrimaryKeyRelatedField(
        queryset=Service.objects.all(),
        many=True, required=False,
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
        read_only_fields = ['id', 'created_at', 'status']

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            self.fields['services'].queryset = Service.objects.filter(user=request.user)
            self.fields['lead_source'].queryset = LeadSource.objects.filter(user=request.user)
            self.fields['contact_type'].queryset = ContactType.objects.filter(user=request.user)

    def update(self, instance, validated_data):
        services = validated_data.pop('services', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if services is not None:
            instance.services.set(services)
        return instance
