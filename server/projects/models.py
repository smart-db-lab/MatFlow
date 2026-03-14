import os
import uuid

from django.conf import settings
from django.db import models


class Project(models.Model):
    """
    A project belongs to one user and groups one or more workspaces.
    On disk: MEDIA_ROOT/projects/<id>/
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="projects",
    )
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, default="")
    is_favorite = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]
        unique_together = [["owner", "name"]]

    def __str__(self) -> str:
        return f"{self.owner.email} / {self.name}"

    @property
    def base_dir(self) -> str:
        return os.path.join(settings.MEDIA_ROOT, "projects", str(self.id))


class Workspace(models.Model):
    """
    A workspace corresponds to a single uploaded dataset inside a project.

    Disk layout (created automatically on save):
        <project.base_dir>/workspaces/<id>/
            original_dataset/   <- uploaded CSV/Excel lands here
            output/
                generated_datasets/  <- every feature-engineering result
                train_test/          <- split_dataset outputs
                charts/              <- downloaded chart images
                models/              <- trained model .pkl files
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name="workspaces",
    )
    name = models.CharField(max_length=255)            # e.g. "iris_20260311_143022"
    dataset_filename = models.CharField(max_length=255)  # original uploaded filename
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.project.name} / {self.name}"

    # ------------------------------------------------------------------
    # Path helpers
    # ------------------------------------------------------------------

    @property
    def base_dir(self) -> str:
        return os.path.join(
            settings.MEDIA_ROOT,
            "projects",
            str(self.project_id),
            "workspaces",
            str(self.id),
        )

    def original_dataset_path(self) -> str:
        return os.path.join(self.base_dir, "original_dataset", self.dataset_filename)

    def output_path(self, subfolder: str = "", filename: str = "") -> str:
        parts = [self.base_dir, "output"]
        if subfolder:
            parts.append(subfolder)
        if filename:
            parts.append(filename)
        return os.path.join(*parts)

    # ------------------------------------------------------------------
    # Folder creation
    # ------------------------------------------------------------------

    def create_folder_structure(self) -> None:
        """Create the full workspace directory tree on disk."""
        for subfolder in (
            "original_dataset",
            "output/generated_datasets",
            "output/train_test",
            "output/charts",
            "output/models",
        ):
            os.makedirs(os.path.join(self.base_dir, subfolder), exist_ok=True)
