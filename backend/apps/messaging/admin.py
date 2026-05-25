from django.contrib import admin
from .models import EmailTemplate, SentEmail


@admin.register(EmailTemplate)
class EmailTemplateAdmin(admin.ModelAdmin):
    list_display = ['name', 'user', 'subject', 'updated_at']
    search_fields = ['name', 'subject']


@admin.register(SentEmail)
class SentEmailAdmin(admin.ModelAdmin):
    list_display = ['to_email', 'subject', 'status', 'user', 'sent_at']
    list_filter = ['status']
    search_fields = ['to_email', 'subject']
