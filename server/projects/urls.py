from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import ProjectViewSet, WorkspaceViewSet, WorkspaceUploadView
from pfs.views import CreateSampleProjectAPIView, SeedGuestSampleAPIView

router = DefaultRouter()
router.register(r"projects", ProjectViewSet, basename="project")
router.register(r"workspaces", WorkspaceViewSet, basename="workspace")

urlpatterns = [
    path("projects/create-sample/", CreateSampleProjectAPIView.as_view(), name="project-create-sample"),
    path("projects/seed-guest-sample/", SeedGuestSampleAPIView.as_view(), name="project-seed-guest-sample"),
    path("", include(router.urls)),
    path(
        "projects/<uuid:project_id>/workspaces/upload/",
        WorkspaceUploadView.as_view(),
        name="workspace-upload",
    ),
]
