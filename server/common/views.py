from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.decorators import api_view, permission_classes
from django.utils import timezone
from datetime import timedelta
from .models import *
from .serializers import *
from rest_framework.permissions import AllowAny, IsAdminUser
from core.permissions import IsSuperUser
from core.base import BaseViewSet
from .schema import *


@JournalSchema
class JournalViewSet(BaseViewSet):
    queryset = Journal.objects.all().order_by('-id')
    serializer_class = JournalSerializer
    
    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            return [AllowAny()]
        return [IsSuperUser()]


@ConferenceSchema
class ConferenceViewSet(BaseViewSet):
    queryset = Conference.objects.all().order_by('-id')
    serializer_class = ConferenceSerializer
    
    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            return [AllowAny()]
        return [IsSuperUser()]


@BookSchema
class BookViewSet(BaseViewSet):
    queryset = Book.objects.all().order_by('-id')
    serializer_class = BookSerializer
    
    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            return [AllowAny()]
        return [IsSuperUser()]


@PatentSchema
class PatentViewSet(BaseViewSet):
    queryset = Patent.objects.all().order_by('-id')
    serializer_class = PatentSerializer
    
    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            return [AllowAny()]
        return [IsSuperUser()]

@DatasetSchema
class DatasetViewSet(BaseViewSet):
    queryset = Dataset.objects.all().order_by('-id')
    serializer_class = DatasetSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]  # Support file uploads
    
    def get_serializer_context(self):
        """Add request to serializer context for file URL generation."""
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            return [AllowAny()]
        return [IsSuperUser()]


@OurServieceSchema
class OurServieceViewSet(BaseViewSet):
    queryset = OurServiece.objects.all().order_by('-id')
    serializer_class = OurServieceSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        service_key = self.request.query_params.get("service_key") or "mlflow"
        return qs.filter(service_key=service_key)

    def perform_create(self, serializer):
        service_key = self.request.query_params.get("service_key") or "mlflow"
        serializer.save(service_key=service_key)

    def perform_update(self, serializer):
        # Preserve existing service_key unless explicitly overridden
        instance = serializer.instance
        service_key = getattr(instance, "service_key", "mlflow")
        serializer.save(service_key=service_key)

    def get_permissions(self):
            if self.action in ["list", "retrieve"]:
                return [AllowAny()]
            return [IsSuperUser()]

@HeaderSectionSchema
class HeaderSectionViewSet(BaseViewSet):
    queryset = HeaderSection.objects.all().order_by('-id')
    serializer_class = HeaderSectionSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        qs = super().get_queryset()
        service_key = self.request.query_params.get("service_key") or "mlflow"
        return qs.filter(service_key=service_key)

    def perform_create(self, serializer):
        service_key = self.request.query_params.get("service_key") or "mlflow"
        serializer.save(service_key=service_key)

    def perform_update(self, serializer):
        """
        Preserve service_key and allow clearing title_image when requested.
        """
        instance = serializer.instance
        service_key = getattr(instance, "service_key", "mlflow")
        # Get the actual value of remove_title_image flag
        remove_flag = self.request.data.get("remove_title_image")
        # Handle both boolean and string values
        if isinstance(remove_flag, str):
            remove_flag = remove_flag.lower() in ["1", "true", "yes", "on"]
        elif remove_flag is None:
            remove_flag = False
        # remove_flag is now a boolean (True/False)
        if remove_flag:
            # Delete underlying file and clear the field
            if instance.title_image:
                instance.title_image.delete(save=False)
            serializer.save(service_key=service_key, title_image=None)
        else:
            serializer.save(service_key=service_key)

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            return [AllowAny()]
        return [IsSuperUser()]

@SupportLogoSchema
class SupportLogoViewSet(BaseViewSet):
    queryset = SupportLogo.objects.all().order_by('order', '-id')
    serializer_class = SupportLogoSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        service_key = self.request.query_params.get("service_key") or "mlflow"
        return qs.filter(service_key=service_key)

    def perform_create(self, serializer):
        service_key = self.request.query_params.get("service_key") or "mlflow"
        serializer.save(service_key=service_key)

    def perform_update(self, serializer):
        instance = serializer.instance
        service_key = getattr(instance, "service_key", "mlflow")
        serializer.save(service_key=service_key)

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            return [AllowAny()]
        return [IsSuperUser()]
    
@HeroImageSchema
class HeroImageViewSet(BaseViewSet):
    queryset = HeroImage.objects.all().order_by('-id')
    serializer_class = HeroImageSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        service_key = self.request.query_params.get("service_key") or "mlflow"
        return qs.filter(service_key=service_key)

    def perform_create(self, serializer):
        service_key = self.request.query_params.get("service_key") or "mlflow"
        serializer.save(service_key=service_key)

    def perform_update(self, serializer):
        instance = serializer.instance
        service_key = getattr(instance, "service_key", "mlflow")
        serializer.save(service_key=service_key)

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            return [AllowAny()]
        return [IsSuperUser()]


@FAQSchema
class FAQViewSet(BaseViewSet):
    queryset = FAQ.objects.all().order_by('order', '-id')
    serializer_class = FAQSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        service_key = self.request.query_params.get("service_key") or "mlflow"
        return qs.filter(service_key=service_key)

    def perform_create(self, serializer):
        service_key = self.request.query_params.get("service_key") or "mlflow"
        serializer.save(service_key=service_key)

    def perform_update(self, serializer):
        instance = serializer.instance
        service_key = getattr(instance, "service_key", "mlflow")
        serializer.save(service_key=service_key)

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            return [AllowAny()]
        return [IsSuperUser()]


# ─── Visitor Tracking ──────────────────────────────────────────────────────────

@api_view(["POST"])
@permission_classes([AllowAny])
def track_visit(request):
    """
    Record a site visit.
    Expects: { "visitor_id": "<uuid>", "visitor_type": "guest"|"user" }
    De-duplicates by visitor_id within the last 24 hours.
    """
    visitor_id = request.data.get("visitor_id", "").strip()
    visitor_type = request.data.get("visitor_type", "guest").strip()

    if not visitor_id:
        return Response(
            {"error": "visitor_id is required"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if visitor_type not in ("guest", "user"):
        visitor_type = "guest"

    # Only count once per visitor_id per 24h window
    cutoff = timezone.now() - timedelta(hours=24)
    already_counted = SiteVisit.objects.filter(
        visitor_id=visitor_id,
        visited_at__gte=cutoff,
    ).exists()

    if not already_counted:
        SiteVisit.objects.create(
            visitor_id=visitor_id,
            visitor_type=visitor_type,
        )

    return Response({"success": True}, status=status.HTTP_200_OK)


@api_view(["GET"])
@permission_classes([AllowAny])
def visitor_stats(request):
    """
    Return overall visitor statistics.
    Response: { "total_visitors": int, "guest_count": int, "user_count": int }
    """
    total = SiteVisit.objects.values("visitor_id").distinct().count()
    guest_count = (
        SiteVisit.objects.filter(visitor_type="guest")
        .values("visitor_id")
        .distinct()
        .count()
    )
    user_count = (
        SiteVisit.objects.filter(visitor_type="user")
        .values("visitor_id")
        .distinct()
        .count()
    )

    return Response(
        {
            "total_visitors": total,
            "guest_count": guest_count,
            "user_count": user_count,
        },
        status=status.HTTP_200_OK,
    )
