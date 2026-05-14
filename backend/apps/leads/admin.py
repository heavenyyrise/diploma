from django.contrib import admin
from .models import Lead

@admin.register(Lead)
class LeadAdmin(admin.ModelAdmin):
    list_display = ['name', 'contact_value', 'contact_type', 'email', 'lead_source', 'service', 'status', 'created_at']
    list_filter = ['status', 'service', 'lead_source']
    search_fields = ['name', 'contact_value', 'email', 'description']
    readonly_fields = ['created_at']
    list_editable = ['status']

#     from django.contrib import admin
# from .models import Lead
# @admin.register(Lead)
# class LeadAdmin(admin.ModelAdmin):
#     list_display = ['name','contact','email','service','status','created_at']
#     list_filter = ['status','service']
#     search_fields = ['name','contact','email','description']
#     readonly_fields = ['created_at']
#     list_editable = ['status']
