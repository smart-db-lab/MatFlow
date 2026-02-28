from .models import *
from django.contrib import admin
from django.contrib.auth.models import Group
from .models import *

class CustomUserAdmin(admin.ModelAdmin):
    list_display = (
        "full_name",
        "email",
        "phone_number",
        "is_email_verified",
        "is_superuser",
        "is_staff"    )
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

admin.site.register(User, CustomUserAdmin)
admin.site.unregister(Group)
