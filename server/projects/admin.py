from django.contrib import admin
from .models import Project, Workspace


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ["name", "owner", "is_favorite", "created_at"]
    list_filter = ["is_favorite"]
    search_fields = ["name", "owner__email"]


@admin.register(Workspace)
class WorkspaceAdmin(admin.ModelAdmin):
    list_display = ["name", "project", "dataset_filename", "created_at"]
    search_fields = ["name", "project__name"]
