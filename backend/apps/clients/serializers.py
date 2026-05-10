from rest_framework import serializers
from .models import Client

class ClientSerializer(serializers.ModelSerializer):
    total_orders = serializers.ReadOnlyField()
    total_income = serializers.ReadOnlyField()
    active_orders = serializers.ReadOnlyField()
    platform_display = serializers.CharField(source='get_platform_display', read_only=True)
    class Meta:
        model = Client
        fields = ['id','name','username','platform','platform_display','phone','email','notes','is_regular','created_at','total_orders','total_income','active_orders']
        read_only_fields = ['id','created_at']

class ClientShortSerializer(serializers.ModelSerializer):
    class Meta:
        model = Client
        fields = ['id','name','username','platform']
