from django.conf import settings
from django.db import models
import uuid


class Project(models.Model):
    """
    A Matflow project, used to scope dashboards and datasets per user.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name="pfs_projects",
        on_delete=models.CASCADE,
    )
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    is_favorite = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at", "name"]

    def __str__(self) -> str:
        return self.name or str(self.id)
