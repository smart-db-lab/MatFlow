from django.urls import path
from .views import EDA

urlpatterns = [
    path('eda/<str:plot_type>/', EDA.as_view(), name='eda_plot'),
]
