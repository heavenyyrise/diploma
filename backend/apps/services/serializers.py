from rest_framework import serializers
from .models import Service
from apps.clients.validators import validate_name_field

class ServiceSerializer(serializers.ModelSerializer):
    active_orders_count = serializers.ReadOnlyField()
    total_orders_count = serializers.ReadOnlyField()
    class Meta:
        model = Service
        fields = ['id','name','description','price','is_active','created_at','active_orders_count','total_orders_count']
        read_only_fields = ['id','created_at']

    def validate(self, attrs):
        name = attrs.get('name', getattr(self.instance, 'name', ''))
        error = validate_name_field(name, 'Название')
        if error:
            raise serializers.ValidationError({'name': error})
        return attrs

class ServiceShortSerializer(serializers.ModelSerializer):
    class Meta:
        model = Service
        fields = ['id','name','price']
