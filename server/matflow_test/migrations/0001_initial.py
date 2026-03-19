from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        ("projects", "0002_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="WorkspaceModelRegistry",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid4,
                        editable=False,
                        primary_key=True,
                        serialize=False,
                    ),
                ),
                ("model_name", models.CharField(max_length=255)),
                ("dataset_name", models.CharField(blank=True, default="", max_length=255)),
                ("target_var", models.CharField(blank=True, default="", max_length=255)),
                ("model_type", models.CharField(blank=True, default="", max_length=64)),
                ("algorithm", models.CharField(blank=True, default="", max_length=255)),
                ("model_file", models.CharField(max_length=255)),
                ("metadata_file", models.CharField(blank=True, default="", max_length=255)),
                ("train_filename", models.CharField(blank=True, default="", max_length=255)),
                ("test_filename", models.CharField(blank=True, default="", max_length=255)),
                ("split_folder", models.CharField(blank=True, default="", max_length=512)),
                ("input_schema", models.JSONField(blank=True, default=list)),
                ("feature_columns", models.JSONField(blank=True, default=list)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "workspace",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="model_registry_entries",
                        to="projects.workspace",
                    ),
                ),
            ],
            options={
                "ordering": ["-updated_at"],
                "unique_together": {("workspace", "model_name")},
            },
        ),
    ]

