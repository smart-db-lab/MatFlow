from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken, AccessToken, TokenError

from django.shortcuts import get_object_or_404
from django.conf import settings
from django.utils.translation import gettext as _
from django.utils import timezone

import random
import string

from .models import User, OTP, UserActionToken
from .serializers import (
    UserSerializer, 
    LoginSerializer, 
    VerifyOTPSerializer, 
    ResetPasswordWithTokenSerializer
)
from users.tasks import (
    send_registration_otp_task,
    send_password_reset_otp_task
)


def issue_otp(user, purpose):
    otp_code = ''.join(random.choices(string.digits, k=6))
    otp, created = OTP.objects.update_or_create(
        user=user,
        purpose=purpose,
        is_used=False,
        defaults={'attempt_count': 0}
    )
    otp.set_code(otp_code)
    otp.attempt_count = 0
    otp.created_at = timezone.now()
    otp.save(update_fields=['code', 'attempt_count', 'created_at', 'updated_at'])
    return otp_code







class UserRegistrationView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        try:
            serializer = UserSerializer(data=request.data)
        except Exception as e:
            print(f"Error initializing serializer: {str(e)}")  # Log the error for debugging
            return Response({
                "success": False,
                "message": str(e)
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            if serializer.is_valid():
                user = serializer.save()
                user.is_active = True  # Here we use is_email_verified as verification gate.
                user.is_email_verified = False
                user.save()

                otp_code = issue_otp(user, 'registration')

                # Send OTP Email
                send_registration_otp_task.delay(user.email, otp_code)

                return Response({
                    'success': True,
                    'message': _('Account created! Please verify your email with the OTP code sent to your email.'),
                    'email': user.email,
                }, status=status.HTTP_201_CREATED)

            return Response({
                "success": False,
                "message": _("Registration failed. Please check the submitted data."),
                "errors": serializer.errors,
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            print(f"Error during registration: {str(e)}")  # Log the error for debugging
            return Response({
                "success": False,
                "message": str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
        

class VerifyOTPView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = VerifyOTPSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            otp = serializer.validated_data['otp']
            
            otp.is_used = True
            otp.save()

            if otp.purpose == 'registration':
                user.is_email_verified = True
                user.save()
                return Response({
                    "success": True,
                    "message": _("Email verified successfully.")
                }, status=status.HTTP_200_OK)
            
            return Response({
                "success": True,
                "message": _("OTP verified successfully.")
            }, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ResendRegistrationOTPView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        email = request.data.get('email')
        if not email:
            return Response({"error": _("Email is required.")}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({"error": _("User with this email does not exist.")}, status=status.HTTP_400_BAD_REQUEST)

        if user.is_email_verified:
            return Response({"error": _("Email is already verified.")}, status=status.HTTP_400_BAD_REQUEST)

        otp_code = issue_otp(user, 'registration')

        send_registration_otp_task.delay(user.email, otp_code)

        return Response({
            "success": True,
            "message": _("Verification OTP resent successfully. Please check your email."),
        }, status=status.HTTP_200_OK)



class ProfileDetailAPIView(APIView):
    permission_classes = [AllowAny]
    def get(self, request):
        user = request.user if request.user and request.user.is_authenticated else None

        if user:
            serializer = UserSerializer(user)
            return Response({"success": True, "user": serializer.data}, status=status.HTTP_200_OK)

    def put(self, request , pk=None):
        if pk:
            user = get_object_or_404(User, pk=pk)
        else:
            user = request.user
        serializer = UserSerializer(user, data=request.data, partial=True)  # Allow partial updates
        if serializer.is_valid():
            serializer.save()
            return Response({"message": _("User updated successfully.") , "user": serializer.data}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def patch(self, request, pk=None):
        if pk:
            user = get_object_or_404(User, pk=pk)
        else:
            user = request.user

        # --- Password Change ---
        old_password = request.data.get("old_password")
        new_password = request.data.get("new_password")
        confirm_password = request.data.get("confirm_password")

        if old_password and new_password and confirm_password:
            if new_password != confirm_password:
                return Response({"error": _("New password and confirm password do not match")},
                                status=status.HTTP_400_BAD_REQUEST)

            if not user.check_password(old_password):
                return Response({"error": _("Old password is incorrect")},
                                status=status.HTTP_400_BAD_REQUEST)

            if len(new_password) < 6:
                return Response({"error": _("New password must be at least 6 characters")},
                                status=status.HTTP_400_BAD_REQUEST)

            user.set_password(new_password)
            user.save()
            return Response({"success": True, "message": _("Password updated successfully")},
                            status=status.HTTP_200_OK)

        # --- Profile Update (name/phone) ---
        updated = False

        if "full_name" in request.data:
            full_name = (request.data.get("full_name") or "").strip()
            user.full_name = full_name
            name_parts = full_name.split()
            user.first_name = name_parts[0] if name_parts else ""
            user.last_name = " ".join(name_parts[1:]) if len(name_parts) > 1 else ""
            updated = True

        if "first_name" in request.data:
            user.first_name = (request.data.get("first_name") or "").strip()
            user.full_name = f"{user.first_name} {user.last_name or ''}".strip()
            updated = True

        if "last_name" in request.data:
            user.last_name = (request.data.get("last_name") or "").strip()
            user.full_name = f"{user.first_name or ''} {user.last_name}".strip()
            updated = True

        if "phone" in request.data:
            user.phone_number = request.data.get("phone") or ""
            updated = True

        if updated:
            user.save()
            return Response({
                "success": True,
                "message": _("Profile updated successfully"),
                "data": (UserSerializer(user).data)
            }, status=status.HTTP_200_OK)


        return Response({"error": _("No valid fields provided")}, status=status.HTTP_400_BAD_REQUEST)
    


    def delete(self, request, pk):
        user = get_object_or_404(User, pk=pk)
        if not user.is_email_verified:
            user.delete()
            return Response({"message": _("User deleted successfully.")}, status=status.HTTP_204_NO_CONTENT)
        return Response({"error": _("User cannot be deleted. User is verified.")}, status=status.HTTP_400_BAD_REQUEST)


class ProfileMeAPIView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get(self, request):
        serializer = UserSerializer(request.user, context={'request': request})
        return Response(serializer.data)

    def put(self, request):
        serializer = UserSerializer(request.user, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response({"message": _("Profile updated."), "user": (serializer.data)})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def patch(self, request):
        return self.put(request)
    
class LoginAPIView(APIView):
    permission_classes = [AllowAny]
    def post(self, request, *args, **kwargs):
        try:
            serializer = LoginSerializer(
                data=request.data,
                context={"request": request, "login_type": "user"},
            )
            if serializer.is_valid():
                user = serializer.validated_data['user']
                refresh_token = RefreshToken.for_user(user)
                access_token = str(refresh_token.access_token)
                enc_access_token = (access_token)
                enc_refresh_token = (str(refresh_token))
     
                return Response({
                    "success": True,
                    "message": _("Login successful."),
                    "refresh": enc_refresh_token,
                    "access": enc_access_token,
                    "email": user.email,
                }, status=status.HTTP_200_OK)
            
            # Handle serializer errors safely
            if serializer.errors:
                first_error_key = list(serializer.errors.keys())[0]
                first_error = serializer.errors[first_error_key]
                if isinstance(first_error, list) and len(first_error) > 0:
                    error_message = str(first_error[0])
                else:
                    error_message = str(first_error)
            else:
                error_message = _("Invalid input data.")
            
            return Response({
                "success": False,
                "error": error_message
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({
                "success": False,
                "error": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class AdminLoginAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        try:
            serializer = LoginSerializer(
                data=request.data,
                context={"request": request, "login_type": "admin"},
            )
            if serializer.is_valid():
                user = serializer.validated_data["user"]
                refresh_token = RefreshToken.for_user(user)
                access_token = str(refresh_token.access_token)

                return Response(
                    {
                        "success": True,
                        "message": _("Admin login successful."),
                        "refresh": str(refresh_token),
                        "access": access_token,
                        "email": user.email,
                    },
                    status=status.HTTP_200_OK,
                )

            if serializer.errors:
                first_error_key = list(serializer.errors.keys())[0]
                first_error = serializer.errors[first_error_key]
                if isinstance(first_error, list) and len(first_error) > 0:
                    error_message = str(first_error[0])
                else:
                    error_message = str(first_error)
            else:
                error_message = _("Invalid input data.")

            return Response(
                {
                    "success": False,
                    "error": error_message,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        except Exception as e:
            return Response(
                {
                    "success": False,
                    "error": str(e),
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    








class ForgotPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        email = request.data.get('email')
        if not email:
            return Response({"error": _("Email is required.")}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = User.objects.get(email__iexact=email.strip())
            
            otp_code = issue_otp(user, 'password_reset')

            # Send OTP Email
            send_password_reset_otp_task.delay(user.email, otp_code)

            return Response({
                "success": True,
                "message": _("Password reset OTP sent successfully. Please check your email.")
            }, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response({"error": _("User with this email does not exist.")}, status=status.HTTP_400_BAD_REQUEST)


class VerifyForgotPasswordOTPView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = VerifyOTPSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            otp = serializer.validated_data['otp']
            
            otp.is_used = True
            otp.save()

            # Generate UserActionToken
            action_token = UserActionToken.objects.create(user=user, purpose='password_reset')
            
            return Response({
                "success": True,
                "message": _("OTP verified successfully."),
                "token": action_token.token
            }, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ResetPasswordWithTokenView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = ResetPasswordWithTokenSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            action_token = serializer.validated_data['action_token']
            
            new_password = serializer.validated_data['new_password']
            user.set_password(new_password)
            # Password reset via email OTP is treated as email ownership verification.
            user.is_email_verified = True
            user.save()

            action_token.is_used = True
            action_token.save()

            return Response({
                "success": True,
                "message": _("Password reset successfully.")
            }, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        


        


from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken, AccessToken, TokenError

class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        refresh_token = request.data.get("refresh_token")

        if not refresh_token:
            return Response({"error": _("Refresh token is required.")}, status=status.HTTP_400_BAD_REQUEST)

        # Attempt to blacklist the refresh token
        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
        except TokenError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        # Optionally try to blacklist the access token
        try:
            auth_header = request.headers.get("Authorization")
            if auth_header:
                access_token = auth_header.split(" ")[1]
                access = AccessToken(access_token)
                access.blacklist()
        except Exception:
            pass  # Access token blacklisting might not be enabled; skip errors silently

        return Response({"success": True, "message": _("Successfully logged out.")}, status=status.HTTP_200_OK)


def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }