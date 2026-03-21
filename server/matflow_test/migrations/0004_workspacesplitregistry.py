from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):

    dependencies = [
        ("projects", "0001_initial"),
        ("matflow_test", "0003_clear_model_deploy_blob"),
    ]

    operations = [
        migrations.CreateModel(
            name="WorkspaceSplitRegistry",
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
                ("split_name", models.CharField(max_length=255)),
                ("dataset_kind", models.CharField(blank=True, default="", max_length=64)),
                (
                    "source_filename",
                    models.CharField(blank=True, default="", max_length=255),
                ),
                ("target_var", models.CharField(blank=True, default="", max_length=255)),
                ("train_filename", models.CharField(max_length=255)),
                ("test_filename", models.CharField(max_length=255)),
                (
                    "split_folder",
                    models.CharField(blank=True, default="train_test", max_length=255),
                ),
                ("test_size", models.FloatField(blank=True, null=True)),
                ("random_state", models.IntegerField(blank=True, null=True)),
                (
                    "stratify_column",
                    models.CharField(blank=True, default="", max_length=255),
                ),
                ("shuffle", models.BooleanField(default=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "workspace",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="split_registry_entries",
                        to="projects.workspace",
                    ),
                ),
            ],
            options={
                "ordering": ["-updated_at"],
                "unique_together": {("workspace", "split_name")},
            },
        ),
    ]
