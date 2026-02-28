from django.urls import path
from .views import *
from .customToken import *
from django.conf import settings
from django.conf.urls.static import static




urlpatterns = [
    path("register/", UserRegistrationView.as_view(), name="user-list-create"),
    path("users/<int:pk>/", ProfileDetailAPIView.as_view(), name="user-detail"),
    path("users/me/", ProfileMeAPIView.as_view(), name="user-me"),
    path("profile-info/", ProfileDetailAPIView.as_view(), name="user-detail"),
    path("profile-info/<int:pk>/", ProfileDetailAPIView.as_view(), name="user-detail"),
    path('login/', LoginAPIView.as_view(), name='login'),
    path('verify-email/', VerifyEmailView.as_view(), name='verify_email'),
    path('forgot-password/', ForgotPasswordView.as_view(), name='forgot_password'),
    path('reset-password/', ResetPasswordView.as_view(), name='reset_password'),
    path('token/refresh/', CustomTokenRefreshView.as_view(), name='token_refresh'),
    path('token/verify/', CustomTokenVerifyView.as_view(), name='token_verify'),
    path('logout/', LogoutView.as_view(), name='logout'),


    # Social login endpoints
    # path('google/', GoogleLoginAPIView.as_view(), name='google-login'),
    # path('facebook/', FacebookLoginAPIView.as_view(), name='facebook-login'),

    
    # path('update-fcm-token/', UpdateFcmTokenAPIView.as_view(), name='update-fcm-token'),
]