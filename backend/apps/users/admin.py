from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, EmailVerificationToken

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ['username', 'email', 'first_name', 'last_name', 'is_staff', 'is_active']
    fieldsets = UserAdmin.fieldsets + (('Дополнительно', {'fields': ('avatar', 'reply_to_email')}),)

@admin.register(EmailVerificationToken)
class EmailVerificationTokenAdmin(admin.ModelAdmin):
    list_display = ['user', 'token', 'created_at', 'is_used']
    readonly_fields = ['token', 'created_at']
