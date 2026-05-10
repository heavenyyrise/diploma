from django.contrib import admin
from .models import Lead
@admin.register(Lead)
class LeadAdmin(admin.ModelAdmin):
    list_display = ['name','contact','email','service','status','created_at']
    list_filter = ['status','service']
    search_fields = ['name','contact','email','description']
    readonly_fields = ['created_at']
    list_editable = ['status']
