from django.urls import path

from .views import FeatureSelectionAPIView

urlpatterns = [
    path('pfs/', FeatureSelectionAPIView.as_view(), name='progressive_feature_selection'),
]