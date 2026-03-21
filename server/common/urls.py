from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import *
from .views import track_visit, visitor_stats


router = DefaultRouter()
router.register("journals", JournalViewSet)
router.register("conferences", ConferenceViewSet)
router.register("books", BookViewSet)
router.register("patents", PatentViewSet)
router.register("datasets", DatasetViewSet)
router.register("our-services", OurServieceViewSet)
router.register("header-section", HeaderSectionViewSet)
router.register("support-logo", SupportLogoViewSet)
router.register("hero-image", HeroImageViewSet)
router.register("faq", FAQViewSet)

urlpatterns = [
    path("csrf/", csrf_cookie, name="csrf_cookie"),
    path("track-visit/", track_visit, name="track_visit"),
    path("visitor-stats/", visitor_stats, name="visitor_stats"),
]

urlpatterns += router.urls
