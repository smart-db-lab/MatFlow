import os
import shutil
import uuid

from django.conf import settings
from django.db import transaction
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Project, Workspace
from .serializers import ProjectSerializer, ProjectListSerializer, WorkspaceSerializer

LEGACY_DATASET_ROOT = getattr(settings, "MATFLOW_DATASET_ROOT", None) or os.path.join(
    os.path.dirname(os.path.dirname(__file__)),
    "dataset",
)


class ProjectViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get_queryset(self):
        return Project.objects.filter(owner=self.request.user)

    def get_serializer_class(self):
        if self.action == "list":
            return ProjectListSerializer
        return ProjectSerializer

    def perform_create(self, serializer):
        project = serializer.save(owner=self.request.user)
        os.makedirs(project.base_dir, exist_ok=True)

    def perform_destroy(self, instance):
        import shutil
        if os.path.exists(instance.base_dir):
            shutil.rmtree(instance.base_dir, ignore_errors=True)
        instance.delete()

    @action(detail=True, methods=["get"])
    def workspaces(self, request, pk=None):
        project = self.get_object()
        workspaces = project.workspaces.all()
        serializer = WorkspaceSerializer(workspaces, many=True)
        return Response(serializer.data)


class WorkspaceViewSet(viewsets.ModelViewSet):
    """CRUD for workspaces — scoped to projects owned by the current user."""
    permission_classes = [IsAuthenticated]
    serializer_class = WorkspaceSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    http_method_names = ["get", "post", "delete", "head", "options"]

    def get_queryset(self):
        return Workspace.objects.filter(project__owner=self.request.user)

    def destroy(self, request, *args, **kwargs):
        workspace = self.get_object()
        import shutil
        if os.path.exists(workspace.base_dir):
            shutil.rmtree(workspace.base_dir, ignore_errors=True)
        workspace.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class WorkspaceUploadView(APIView):
    """
    POST /api/projects/<project_id>/workspaces/upload/

    Accepts a multipart form with:
      - file: the CSV/Excel dataset
      - name: (optional) workspace name — defaults to <stem>_<timestamp>
    """
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def _migrate_legacy_project_data(self, project):
        """
        Move legacy dataset tree (server/dataset/<project_id>/...) into one
        workspace so old sample projects follow the new workspace layout.
        """
        legacy_root = os.path.join(LEGACY_DATASET_ROOT, str(project.id))
        if not os.path.isdir(legacy_root):
            return
        if Workspace.objects.filter(project=project).exists():
            return

        entries = sorted(os.listdir(legacy_root))
        file_entries = [e for e in entries if os.path.isfile(os.path.join(legacy_root, e))]
        dir_entries = [e for e in entries if os.path.isdir(os.path.join(legacy_root, e))]
        if not file_entries and not dir_entries:
            return

        primary_file = file_entries[0] if file_entries else "sample.csv"
        workspace = Workspace.objects.create(
            project=project,
            name=os.path.splitext(primary_file)[0] or "sample_dataset",
            dataset_filename=primary_file,
        )
        workspace.create_folder_structure()

        original_dir = os.path.join(workspace.base_dir, "original_dataset")
        output_dir = workspace.output_path()

        for file_name in file_entries:
            src = os.path.join(legacy_root, file_name)
            dst = os.path.join(original_dir, file_name)
            shutil.move(src, dst)

        for dir_name in dir_entries:
            src_dir = os.path.join(legacy_root, dir_name)
            if dir_name.lower() == "output":
                for child in os.listdir(src_dir):
                    shutil.move(
                        os.path.join(src_dir, child),
                        os.path.join(output_dir, child),
                    )
                shutil.rmtree(src_dir, ignore_errors=True)
            else:
                shutil.move(src_dir, os.path.join(original_dir, dir_name))

        try:
            os.rmdir(legacy_root)
        except OSError:
            pass

    def _bootstrap_from_legacy_project(self, request, project_id):
        """
        Backward-compatibility bridge:
        If a project exists only in legacy pfs.Project, mirror it into
        projects.Project so workspace uploads work.
        """
        try:
            from pfs.models import Project as LegacyProject  # lazy import
            legacy = LegacyProject.objects.get(pk=project_id, owner=request.user)
        except Exception:
            return None

        project = Project.objects.create(
            id=legacy.id,
            owner=legacy.owner,
            name=legacy.name,
            description=legacy.description,
            is_favorite=legacy.is_favorite,
        )
        os.makedirs(project.base_dir, exist_ok=True)
        self._migrate_legacy_project_data(project)
        return project

    def post(self, request, project_id):
        try:
            project = Project.objects.get(pk=project_id, owner=request.user)
        except Project.DoesNotExist:
            project = self._bootstrap_from_legacy_project(request, project_id)
            if not project:
                return Response({"error": "Project not found."}, status=status.HTTP_404_NOT_FOUND)

        uploaded_file = request.FILES.get("file")
        if not uploaded_file:
            return Response({"error": "No file provided."}, status=status.HTTP_400_BAD_REQUEST)

        original_filename = uploaded_file.name
        name = request.data.get("name") or self._default_name(original_filename)

        with transaction.atomic():
            workspace = Workspace.objects.create(
                project=project,
                name=name,
                dataset_filename=original_filename,
            )
            workspace.create_folder_structure()

            dest_path = workspace.original_dataset_path()
            with open(dest_path, "wb") as f:
                for chunk in uploaded_file.chunks():
                    f.write(chunk)

        serializer = WorkspaceSerializer(workspace)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @staticmethod
    def _default_name(filename: str) -> str:
        from datetime import datetime
        stem = os.path.splitext(filename)[0]
        ts = datetime.now().strftime("%Y%m%d_%H%M%S")
        return f"{stem}_{ts}"
