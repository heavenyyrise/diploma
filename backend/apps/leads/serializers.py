from rest_framework import serializers
from .models import Lead
from apps.services.serializers import ServiceShortSerializer


class LeadPublicSerializer(serializers.ModelSerializer):
    class Meta:
        model = Lead
        fields = ['id','name','contact','email','service','description','budget','deadline']


class LeadSerializer(serializers.ModelSerializer):
    service_detail = ServiceShortSerializer(source='service', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Lead
        fields = ['id','name','contact','email','service','service_detail','description','budget','deadline','status','status_display','notes','created_at']
        read_only_fields = ['id','created_at']
