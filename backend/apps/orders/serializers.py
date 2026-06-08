import os
from rest_framework import serializers
from .models import Order, OrderChangeLog, OrderAttachment
from .services import build_order_snapshot, log_order_changes, log_order_created, FIELD_LABELS
from .validators import validate_order_status_for_deadline
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

    def validate(self, attrs):
        status = attrs.get('status', getattr(self.instance, 'status', 'in_progress'))
        deadline = attrs.get('deadline', getattr(self.instance, 'deadline', None))
        created_at = self.instance.created_at if self.instance else None
        error = validate_order_status_for_deadline(status, deadline, created_at)
        if error:
            raise serializers.ValidationError({'status': error})
        return attrs

    def create(self, validated_data):
        services = validated_data.pop('services', [])
        order = Order.objects.create(**validated_data)
        order.services.set(services)
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            log_order_created(order, request.user)
        return order

    def update(self, instance, validated_data):
        services = validated_data.pop('services', None)
        old_snapshot = build_order_snapshot(instance)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if services is not None:
            instance.services.set(services)
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            log_order_changes(instance, old_snapshot, build_order_snapshot(instance), request.user)
        return instance


class OrderChangeLogSerializer(serializers.ModelSerializer):
    field_label = serializers.SerializerMethodField()
    changed_by_name = serializers.SerializerMethodField()

    class Meta:
        model = OrderChangeLog
        fields = ['id', 'field', 'field_label', 'old_value', 'new_value', 'changed_at', 'changed_by_name']

    def get_field_label(self, obj):
        return FIELD_LABELS.get(obj.field, obj.field)

    def get_changed_by_name(self, obj):
        if not obj.changed_by:
            return '—'
        return obj.changed_by.get_full_name() or obj.changed_by.username


ALLOWED_ATTACHMENT_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.pdf', '.docx', '.zip'}
MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024


ATTACHMENT_KIND_CHOICES = {'document', 'deliverable'}


class OrderAttachmentSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField()
    uploaded_by_name = serializers.SerializerMethodField()
    is_image = serializers.SerializerMethodField()

    class Meta:
        model = OrderAttachment
        fields = [
            'id', 'kind', 'original_name', 'file_size', 'file_url',
            'is_image', 'uploaded_at', 'uploaded_by_name',
        ]
        read_only_fields = fields

    def get_file_url(self, obj):
        request = self.context.get('request')
        if obj.file and request:
            return request.build_absolute_uri(obj.file.url)
        return obj.file.url if obj.file else ''

    def get_uploaded_by_name(self, obj):
        if not obj.uploaded_by:
            return '—'
        return obj.uploaded_by.get_full_name() or obj.uploaded_by.username

    def get_is_image(self, obj):
        ext = os.path.splitext(obj.original_name)[1].lower()
        return ext in {'.jpg', '.jpeg', '.png'}


class OrderAttachmentUploadSerializer(serializers.ModelSerializer):
    kind = serializers.ChoiceField(
        choices=[('document', 'Документ'), ('deliverable', 'Финальный')],
        default='document',
        required=False,
    )

    class Meta:
        model = OrderAttachment
        fields = ['file', 'kind']

    def validate_kind(self, value):
        if value not in ATTACHMENT_KIND_CHOICES:
            raise serializers.ValidationError('Недопустимый тип вложения.')
        return value

    def validate_file(self, value):
        ext = os.path.splitext(value.name)[1].lower()
        if ext not in ALLOWED_ATTACHMENT_EXTENSIONS:
            raise serializers.ValidationError(
                'Допустимые форматы: JPG, PNG, PDF, DOCX, ZIP.'
            )
        if value.size > MAX_ATTACHMENT_SIZE:
            raise serializers.ValidationError('Максимальный размер файла — 10 МБ.')
        return value
