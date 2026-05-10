from django.contrib import admin
from .models import Order
@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ['title','client','status','platform','price','deadline','created_at']
    list_filter = ['status','platform','source']
    search_fields = ['title','description','client__name']
    readonly_fields = ['created_at','updated_at','completed_at']
    list_editable = ['status']
    date_hierarchy = 'created_at'
