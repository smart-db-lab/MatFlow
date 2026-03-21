from django.contrib import admin
from django.contrib.auth.models import Group
from .models import User, OTP, UserActionToken

@admin.register(User)
class CustomUserAdmin(admin.ModelAdmin):
    list_display = (
        "full_name",
        "email",
        "phone_number",
        "is_email_verified",
        "is_superuser",
        "is_staff"
    )
    search_fields = (
        "full_name",
        "email",
        "phone_number",
    )
    list_filter = (
        "is_email_verified",
        "is_superuser",
        "is_staff",
    )

@admin.register(OTP)
class OTPAdmin(admin.ModelAdmin):
    list_display = ("user", "purpose", "is_used", "attempt_count", "created_at")
    list_filter = ("purpose", "is_used")
    search_fields = ("user__email", "user__full_name")

@admin.register(UserActionToken)
class UserActionTokenAdmin(admin.ModelAdmin):
    list_display = ("user", "purpose", "is_used", "created_at")
    list_filter = ("purpose", "is_used")
    search_fields = ("user__email", "user__full_name")

admin.site.unregister(Group)
