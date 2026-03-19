import uuid
from django.db import models
from django.conf import settings

class BaseModel(models.Model):

    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name="%(class)s_created"
    )
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name="%(class)s_updated"
    )

    is_active = models.BooleanField(default=True, db_index=True)

    class Meta:
        abstract = True
        ordering = ["-created_at"]

    def deactivate(self):
        self.is_active = False
        self.save(update_fields=["is_active"])

    def activate(self):
        self.is_active = True
        self.save(update_fields=["is_active"])
