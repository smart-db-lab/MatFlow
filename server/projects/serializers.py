from rest_framework import serializers
from .models import Project, Workspace


class WorkspaceSerializer(serializers.ModelSerializer):
    # List of filenames in output/generated_datasets/ — computed from disk
    generated_datasets = serializers.SerializerMethodField()
    # List of filenames in output/train_test/ — computed from disk
    train_test_files = serializers.SerializerMethodField()

    class Meta:
        model = Workspace
        fields = [
            "id",
            "name",
            "dataset_filename",
            "generated_datasets",
            "train_test_files",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at",
                            "generated_datasets", "train_test_files"]

    def _list_folder(self, instance, subfolder):
        import os
        folder = instance.output_path(subfolder)
        if not os.path.exists(folder):
            return []
        return sorted(
            f for f in os.listdir(folder)
            if not f.startswith(".")
        )

    def get_generated_datasets(self, instance):
        return self._list_folder(instance, "generated_datasets")

    def get_train_test_files(self, instance):
        return self._list_folder(instance, "train_test")


class ProjectSerializer(serializers.ModelSerializer):
    workspaces = WorkspaceSerializer(many=True, read_only=True)
    workspace_count = serializers.IntegerField(source="workspaces.count", read_only=True)

    class Meta:
        model = Project
        fields = [
            "id",
            "name",
            "description",
            "is_favorite",
            "workspace_count",
            "workspaces",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at", "workspace_count"]


class ProjectListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list views (no nested workspaces)."""
    workspace_count = serializers.IntegerField(source="workspaces.count", read_only=True)

    class Meta:
        model = Project
        fields = ["id", "name", "description", "is_favorite", "workspace_count", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at", "workspace_count"]
