from django.urls import path

from .views import (
    FeatureSelectionAPIView,
    ProjectListCreateAPIView,
    ProjectDetailAPIView,
    CreateSampleProjectAPIView,
    SeedGuestSampleAPIView,
)

urlpatterns = [
    path('pfs/', FeatureSelectionAPIView.as_view(), name='progressive_feature_selection'),

    # Project management
    path('projects/', ProjectListCreateAPIView.as_view(), name='project-list-create'),
    path('projects/create-sample/', CreateSampleProjectAPIView.as_view(), name='project-create-sample'),
    path('projects/seed-guest-sample/', SeedGuestSampleAPIView.as_view(), name='project-seed-guest-sample'),
    path('projects/<uuid:id>/', ProjectDetailAPIView.as_view(), name='project-detail'),
]