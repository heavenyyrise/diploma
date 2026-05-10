from django.contrib import admin
from .models import Client
@admin.register(Client)
class ClientAdmin(admin.ModelAdmin):
    list_display = ['name','username','platform','phone','is_regular','created_at']
    list_filter = ['platform','is_regular']
    search_fields = ['name','username','email']
    list_editable = ['is_regular']
