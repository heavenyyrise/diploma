from rest_framework import serializers
from .models import Order
from apps.clients.models import Client
from apps.clients.serializers import ClientShortSerializer
from apps.services.models import Service
from apps.services.serializers import ServiceShortSerializer


class OrderListSerializer(serializers.ModelSerializer):
    client = ClientShortSerializer(read_only=True)
    services = ServiceShortSerializer(many=True, read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Order
        fields = ['id', 'title', 'client', 'services', 'status', 'status_display', 'price', 'deadline', 'created_at', 'source']


class OrderSerializer(serializers.ModelSerializer):
    client_detail = ClientShortSerializer(source='client', read_only=True)
    services_detail = ServiceShortSerializer(source='services', many=True, read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    client = serializers.PrimaryKeyRelatedField(
        queryset=Client.objects.all(),
        allow_null=True, required=False,
    )
    services = serializers.PrimaryKeyRelatedField(
        queryset=Service.objects.all(),
        many=True, required=False,
    )

    class Meta:
        model = Order
        fields = [
            'id', 'title', 'client', 'client_detail', 'services', 'services_detail',
            'description', 'status', 'status_display', 'source',
            'price', 'deadline', 'created_at', 'updated_at', 'completed_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'completed_at']

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            self.fields['client'].queryset = Client.objects.filter(user=request.user)
            self.fields['services'].queryset = Service.objects.filter(user=request.user)

    def create(self, validated_data):
        services = validated_data.pop('services', [])
        order = Order.objects.create(**validated_data)
        order.services.set(services)
        return order

    def update(self, instance, validated_data):
        services = validated_data.pop('services', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if services is not None:
            instance.services.set(services)
        return instance
