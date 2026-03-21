from django.urls import path
from .views import *
from .customToken import *
from django.conf import settings
from django.conf.urls.static import static




urlpatterns = [
    path("signup/", UserRegistrationView.as_view(), name="signup"),
    path("verify-otp/", VerifyOTPView.as_view(), name="verify-otp"),
    path("resend-otp/", ResendRegistrationOTPView.as_view(), name="resend-otp"),
    path('login/', LoginAPIView.as_view(), name='login'),
    path('admin/login/', AdminLoginAPIView.as_view(), name='admin-login'),
    
    path('forgot-password/', ForgotPasswordView.as_view(), name='forgot-password'),
    path('verify-forgot-password-otp/', VerifyForgotPasswordOTPView.as_view(), name='verify-forgot-password-otp'),
    path('reset-password/', ResetPasswordWithTokenView.as_view(), name='reset-password'),

    path("users/me/", ProfileMeAPIView.as_view(), name="user-me"),
    path("profile-info/", ProfileDetailAPIView.as_view(), name="profile-detail"),
    path("profile-info/<int:pk>/", ProfileDetailAPIView.as_view(), name="profile-detail-pk"),
    
    path('token/refresh/', CustomTokenRefreshView.as_view(), name='token_refresh'),
    path('token/verify/', CustomTokenVerifyView.as_view(), name='token_verify'),
    path('logout/', LogoutView.as_view(), name='logout'),
]