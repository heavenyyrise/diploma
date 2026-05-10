from django.contrib import admin
from .models import FormSettings
@admin.register(FormSettings)
class FormSettingsAdmin(admin.ModelAdmin):
    filter_horizontal = ['services']
