from django.urls import path
from . import views

urlpatterns = [
    path('optimize/', views.optimize, name='optimize'),
    path('status/<str:task_id>/', views.check_optimization_status, name='check-status'),

]