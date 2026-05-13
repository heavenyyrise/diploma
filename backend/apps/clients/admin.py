from django.contrib import admin
from .models import Client, ContactInfo, ContactType, LeadSource


@admin.register(LeadSource)
class LeadSourceAdmin(admin.ModelAdmin):
    list_display = ['name', 'is_active', 'order']
    list_editable = ['is_active', 'order']


@admin.register(ContactType)
class ContactTypeAdmin(admin.ModelAdmin):
    list_display = ['name', 'is_active', 'order']
    list_editable = ['is_active', 'order']


class ContactInfoInline(admin.TabularInline):
    model = ContactInfo
    extra = 1


@admin.register(Client)
class ClientAdmin(admin.ModelAdmin):
    list_display = ['name', 'lead_source', 'is_regular', 'created_at']
    list_filter = ['lead_source', 'is_regular']
    search_fields = ['name', 'contacts__value']
    list_editable = ['is_regular']
    inlines = [ContactInfoInline]
