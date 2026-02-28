from rest_framework.permissions import BasePermission


class IsSuperUser(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_superuser)


class IsAuthenticatedOrGuest(BasePermission):
    """Allow authenticated users AND anonymous guests for ML operations."""

    def has_permission(self, request, view):
        return True
