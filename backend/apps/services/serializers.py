from rest_framework import serializers
from .models import Service

class ServiceSerializer(serializers.ModelSerializer):
    active_orders_count = serializers.ReadOnlyField()
    total_orders_count = serializers.ReadOnlyField()
    class Meta:
        model = Service
        fields = ['id','name','description','price','is_active','created_at','active_orders_count','total_orders_count']
        read_only_fields = ['id','created_at']

class ServiceShortSerializer(serializers.ModelSerializer):
    class Meta:
        model = Service
        fields = ['id','name','price']
