from django.db import models
import uuid


class WorkspaceModelRegistry(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    workspace = models.ForeignKey(
        "projects.Workspace",
        on_delete=models.CASCADE,
        related_name="model_registry_entries",
    )
    model_name = models.CharField(max_length=255)
    dataset_name = models.CharField(max_length=255, blank=True, default="")
    target_var = models.CharField(max_length=255, blank=True, default="")
    model_type = models.CharField(max_length=64, blank=True, default="")
    algorithm = models.CharField(max_length=255, blank=True, default="")
    model_file = models.CharField(max_length=255)
    metadata_file = models.CharField(max_length=255, blank=True, default="")
    train_filename = models.CharField(max_length=255, blank=True, default="")
    test_filename = models.CharField(max_length=255, blank=True, default="")
    split_folder = models.CharField(max_length=512, blank=True, default="")
    input_schema = models.JSONField(default=list, blank=True)
    feature_columns = models.JSONField(default=list, blank=True)
    metrics = models.JSONField(default=dict, blank=True)
    metrics_table = models.JSONField(default=list, blank=True)
    y_pred = models.JSONField(default=list, blank=True)
    model_deploy = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]
        unique_together = [["workspace", "model_name"]]

    def __str__(self):
        label = self.dataset_name or "dataset"
        return f"{label} :: {self.model_name}"


class WorkspaceSplitRegistry(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    workspace = models.ForeignKey(
        "projects.Workspace",
        on_delete=models.CASCADE,
        related_name="split_registry_entries",
    )
    split_name = models.CharField(max_length=255)
    dataset_kind = models.CharField(max_length=64, blank=True, default="")
    source_filename = models.CharField(max_length=255, blank=True, default="")
    target_var = models.CharField(max_length=255, blank=True, default="")
    train_filename = models.CharField(max_length=255)
    test_filename = models.CharField(max_length=255)
    split_folder = models.CharField(max_length=255, blank=True, default="train_test")
    test_size = models.FloatField(null=True, blank=True)
    random_state = models.IntegerField(null=True, blank=True)
    stratify_column = models.CharField(max_length=255, blank=True, default="")
    shuffle = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]
        unique_together = [["workspace", "split_name"]]

    def __str__(self):
        return f"{self.workspace_id} :: {self.split_name}"

# Create your models here.
