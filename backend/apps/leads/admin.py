from django.contrib import admin
from .models import Lead


@admin.register(Lead)
class LeadAdmin(admin.ModelAdmin):
    list_display = ['name', 'contact_value', 'contact_type', 'email', 'lead_source', 'status', 'created_at']
    list_filter = ['status', 'lead_source']
    search_fields = ['name', 'contact_value', 'email', 'description']
    readonly_fields = ['created_at']
    list_editable = ['status']
    filter_horizontal = ['services']
