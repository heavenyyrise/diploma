from rest_framework import serializers
from .models import Client, ContactInfo, ContactType, LeadSource
from .validators import validate_client_name, validate_name_field


class LeadSourceSerializer(serializers.ModelSerializer):
    class Meta:
        model = LeadSource
        fields = ['id', 'name', 'is_active', 'order']

    def validate(self, attrs):
        name = attrs.get('name', getattr(self.instance, 'name', ''))
        error = validate_name_field(name, 'Название')
        if error:
            raise serializers.ValidationError({'name': error})
        return attrs


class ContactTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactType
        fields = ['id', 'name', 'is_active', 'order']

    def validate(self, attrs):
        name = attrs.get('name', getattr(self.instance, 'name', ''))
        error = validate_name_field(name, 'Название')
        if error:
            raise serializers.ValidationError({'name': error})
        return attrs


class ContactInfoSerializer(serializers.ModelSerializer):
    contact_type_name = serializers.CharField(source='contact_type.name', read_only=True)

    class Meta:
        model = ContactInfo
        fields = ['id', 'contact_type', 'contact_type_name', 'value']


class ClientSerializer(serializers.ModelSerializer):
    total_orders = serializers.ReadOnlyField()
    total_income = serializers.SerializerMethodField()
    active_orders = serializers.ReadOnlyField()
    primary_contact = serializers.ReadOnlyField()
    lead_source_name = serializers.CharField(source='lead_source.name', read_only=True)
    contacts = ContactInfoSerializer(many=True, read_only=True)

    class Meta:
        model = Client
        fields = [
            'id', 'name', 'lead_source', 'lead_source_name',
            'contacts', 'primary_contact',
            'notes', 'is_regular', 'created_at',
            'total_orders', 'total_income', 'active_orders',
        ]
        read_only_fields = ['id', 'created_at']

    def get_total_income(self, obj):
        if hasattr(obj, 'income_total'):
            return float(obj.income_total)
        return obj.total_income

    def validate(self, attrs):
        name = attrs.get('name', getattr(self.instance, 'name', ''))
        error = validate_client_name(name)
        if error:
            raise serializers.ValidationError({'name': error})
        return attrs

    def create(self, validated_data):
        contacts_data = self.context.get('contacts', [])
        client = Client.objects.create(**validated_data)
        for c in contacts_data:
            ContactInfo.objects.create(client=client, **c)
        return client

    def update(self, instance, validated_data):
        contacts_data = self.context.get('contacts', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if contacts_data is not None:
            instance.contacts.all().delete()
            for c in contacts_data:
                ContactInfo.objects.create(client=instance, **c)
        return instance


class ClientShortSerializer(serializers.ModelSerializer):
    primary_contact = serializers.ReadOnlyField()
    lead_source_name = serializers.CharField(source='lead_source.name', read_only=True)

    class Meta:
        model = Client
        fields = ['id', 'name', 'primary_contact', 'lead_source_name']
