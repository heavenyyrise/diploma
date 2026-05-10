from rest_framework import serializers
from .models import FormSettings
from apps.services.serializers import ServiceShortSerializer


class FormSettingsSerializer(serializers.ModelSerializer):
    services_detail = ServiceShortSerializer(source='services', many=True, read_only=True)

    class Meta:
        model = FormSettings
        fields = ['id','title','subtitle','button_text','success_message','show_email','show_budget','show_deadline','show_description','show_service','services','services_detail']


class FormSettingsPublicSerializer(serializers.ModelSerializer):
    services = serializers.SerializerMethodField()

    class Meta:
        model = FormSettings
        fields = ['title','subtitle','button_text','success_message','show_email','show_budget','show_deadline','show_description','show_service','services']

    def get_services(self, obj):
        from apps.services.models import Service
        qs = obj.services.filter(is_active=True) if obj.services.exists() else Service.objects.none()
        return ServiceShortSerializer(qs, many=True).data
