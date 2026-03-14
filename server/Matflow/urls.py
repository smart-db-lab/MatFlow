

from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from django.views.static import serve
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularSwaggerView,
    SpectacularRedocView,
)


urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('users.urls')),
    path('api/', include('projects.urls')),
    path('api/', include('pso.urls')),
    path('api/', include('pfs.urls')),
    path('api/', include('matflow_test.urls')),
    path('api/', include('eda.urls')),
    path('api/', include('dataset_manager.urls')),
    path("api/", include("molecules.urls")),
    path("api/chatbot/", include("chatbot.urls")),
    path("api/", include("common.urls")),
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),

    # Swagger UI
    path(
        "swagger/",
        SpectacularSwaggerView.as_view(url_name="schema"),
        name="swagger-ui",
    ),

    # Redoc UI
    path(
        "redoc/",
        SpectacularRedocView.as_view(url_name="schema"),
        name="redoc-ui",
    ),

]
# Keep media files available for local runs even when DEBUG is disabled.
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
if not settings.DEBUG:
    urlpatterns += [
        re_path(r"^media/(?P<path>.*)$", serve, {"document_root": settings.MEDIA_ROOT}),
    ]
