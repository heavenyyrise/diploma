from rest_framework import serializers
from .models import EmailTemplate, SentEmail


class EmailTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmailTemplate
        fields = ['id', 'name', 'subject', 'body', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class SendEmailSerializer(serializers.Serializer):
    to_email = serializers.EmailField()
    subject = serializers.CharField(max_length=255)
    body = serializers.CharField()
    order_id = serializers.IntegerField(required=False, allow_null=True)
    client_id = serializers.IntegerField(required=False, allow_null=True)
    template_id = serializers.IntegerField(required=False, allow_null=True)


class SentEmailSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    order_title = serializers.SerializerMethodField()
    client_name = serializers.SerializerMethodField()

    class Meta:
        model = SentEmail
        fields = [
            'id', 'to_email', 'subject', 'body', 'status', 'status_display',
            'sent_at', 'error_message', 'order', 'order_title', 'client', 'client_name',
        ]

    def get_order_title(self, obj):
        return obj.order.title if obj.order_id else None

    def get_client_name(self, obj):
        return obj.client.name if obj.client_id else None
