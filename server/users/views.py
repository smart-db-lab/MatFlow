from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.shortcuts import get_object_or_404
from .models import User
from .serializers import *
from rest_framework.permissions import AllowAny , IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.utils.http import urlsafe_base64_encode , urlsafe_base64_decode
from django.utils.encoding import force_bytes
from django.core.mail import send_mail
from django.conf import settings
from django.db.models import Q
from rest_framework_simplejwt.exceptions import InvalidToken
from users.tasks import send_password_reset_task , send_verification_email_task
import json
from rest_framework.renderers import JSONRenderer
from django.db import transaction
from users.emails import email_token_generator
from django.utils.translation import gettext as _
from rest_framework.decorators import api_view, permission_classes
import random
import string


# ========== Simple signup with verification code ==========
@api_view(['POST'])
@permission_classes([AllowAny])
def signup(request):
    """Simple signup with 6-digit verification code (printed to console)"""
    username = request.data.get('username')
    email = request.data.get('email')
    password = request.data.get('password')

    if not email or not password:
        return Response({'error': 'Email and password are required.'}, status=status.HTTP_400_BAD_REQUEST)

    if User.objects.filter(email=email).exists():
        return Response({'error': 'A user with this email already exists.'}, status=status.HTTP_400_BAD_REQUEST)

    # Create user with custom model fields
    user = User(
        email=email,
        username=username or '',
        full_name=username or '',
        is_active=True,
        is_email_verified=False,
    )
    user.set_password(password)

    # Generate a 6-digit verification code and store it
    code = ''.join(random.choices(string.digits, k=6))
    user.verification_token = code
    user.save()

    # Print the verification code to the server terminal
    print("\n" + "=" * 50)
    print(f"  VERIFICATION CODE for {email}")
    print(f"  Code: {code}")
    print("=" * 50 + "\n")

    return Response({
        'message': 'Account created! Please verify your email with the code.',
        'email': email,
        'requires_verification': True,
    }, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([AllowAny])
def verify_code(request):
    """Verify email with 6-digit code"""
    email = request.data.get('email')
    code = request.data.get('code')

    if not email or not code:
        return Response({'error': 'Email and verification code are required.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

    if user.is_email_verified:
        return Response({'message': 'Email is already verified.'}, status=status.HTTP_200_OK)

    if user.verification_token == code:
        user.is_email_verified = True
        user.verification_token = ''
        user.save()
        return Response({'message': 'Email verified successfully! You can now log in.'}, status=status.HTTP_200_OK)
    else:
        return Response({'error': 'Invalid verification code.'}, status=status.HTTP_400_BAD_REQUEST)



class UserRegistrationView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = UserSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            with transaction.atomic():
                user = serializer.save()

                token = email_token_generator.make_token(user)
                uid = urlsafe_base64_encode(force_bytes(user.email))
                verification_link = f"{settings.FRONTEND_URL}/verify-email/{uid}/{token}"
                print(verification_link)
                send_verification_email_task.delay(user.email, verification_link)
        except Exception as e:
            if "user" in locals():
                user.delete()
            return Response(
                {"success": False,"error": "Email sending failed. Registration aborted."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        return Response(
            {"success": True, "message": _("User registered successfully. Please check your email for verification.")},
            status=status.HTTP_201_CREATED
        )
    
   
    

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
            user.full_name = request.data.get("full_name") or ""
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
            serializer = LoginSerializer(data=request.data , context={"request": request})
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

    


class VerifyEmailView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        uid = request.data.get('uid')
        token = request.data.get('token')

        try:
            decoded_email = urlsafe_base64_decode(uid).decode()
            user = User.objects.get(email=decoded_email)

           # Verify the token
            if email_token_generator.check_token(user, token):
                user.is_email_verified = True
                user.is_active = True
                user.save()
                return Response({"success": True,"message": _("Email verified successfully.")}, status=status.HTTP_200_OK)
            else:
                return Response({ "success": False,"message": _("Invalid verification link.")}, status=status.HTTP_400_BAD_REQUEST)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            return Response({"success": False, "error": _("Invalid verification link.")}, status=status.HTTP_400_BAD_REQUEST)





class ForgotPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        email = request.data.get('email')
        if not email:
            return Response({"error": _("Email is required.")}, status=status.HTTP_400_BAD_REQUEST)
        if '@' not in email:
            return Response({"error": _("Invalid email format.")}, status=status.HTTP_400_BAD_REQUEST)
        try:
            user = User.objects.get(email=email)
            if not user.is_email_verified:
                return Response({"error": _("User is not verified.")}, status=status.HTTP_400_BAD_REQUEST)
            token = email_token_generator.make_token(user)
            uid = urlsafe_base64_encode(force_bytes(user.email))
            reset_link = f"{settings.FRONTEND_URL}/reset-password/{uid}/{token}"
            send_password_reset_task.delay(user.email, reset_link)
            return Response({"success": True ,"message": _("Password reset email sent successfully. Please check your email.")}, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response({"error": _("User with this email does not exist.")}, status=status.HTTP_400_BAD_REQUEST)
        

class ResetPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        uid = request.data.get('uid')
        token = request.data.get('token')
        newPassword = request.data.get('newPassword', None)  # Optional for token verification
        confirmPassword = request.data.get('confirmPassword', None)  # Optional for token verification

        try:
            user_id = urlsafe_base64_decode(uid).decode()  # Decode UID to user.pk
            user = User.objects.get(email=user_id)  # Use primary key (pk)

            if not email_token_generator.check_token(user, token):
                return Response({"error": _("Invalid or expired token.")}, status=status.HTTP_400_BAD_REQUEST)

            if not newPassword or not confirmPassword:
                return Response({"newPassword" : "pa" , "Cp" : "s" }, status=status.HTTP_400_BAD_REQUEST)
            if newPassword != confirmPassword:
                return Response({"error": _("Passwords do not match.")}, status=status.HTTP_400_BAD_REQUEST)
            
            if newPassword == confirmPassword:
                if len(newPassword) < 8:
                    return Response({"error": _("Password must be at least 8 characters long.")}, status=status.HTTP_400_BAD_REQUEST)
                # if not any(char.isdigit() for char in newPassword):
                #     return Response({"error": "Password must contain at least one digit."}, status=status.HTTP_400_BAD_REQUEST)
                # if not any(char.isalpha() for char in newPassword):
                #     return Response({"error": "Password must contain at least one letter."}, status=status.HTTP_400_BAD_REQUEST)
                # if not any(char in "!@#$%^&*()-_+=<>" for char in newPassword):
                #     return Response({"error": "Password must contain at least one special character."}, status=status.HTTP_400_BAD_REQUEST)
                # if not any(char.isupper() for char in newPassword):
                #     return Response({"error": "Password must contain at least one uppercase letter."}, status=status.HTTP_400_BAD_REQUEST)

            user.set_password(newPassword)
            user.save()
            return Response({"success": True ,"message": _("Password reset successfully.")}, status=status.HTTP_200_OK)

        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            return Response({"error": _("Invalid token or user ID.")}, status=status.HTTP_400_BAD_REQUEST)
        


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






from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import get_user_model, login
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
import requests as pyrequests
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()

# GOOGLE_CLIENT_ID = settings.GOOGLE_CLIENT_ID
# FB_APP_ID = settings.FB_APP_ID
# FB_APP_SECRET = settings.FB_APP_SECRET


def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }


# views.py
# from google.oauth2 import id_token
# from google.auth.transport import requests

# class GoogleLoginAPIView(APIView):
#     permission_classes = [AllowAny]

#     def post(self, request):
#         token = request.data.get("id_token")
#         if not token:
#             return Response({"error": _("id_token required")}, status=400)

#         try:
#             idinfo = id_token.verify_oauth2_token(token, requests.Request(), settings.GOOGLE_CLIENT_ID , clock_skew_in_seconds=10  )

#             email = idinfo["email"]
#             full_name = idinfo.get("name", "")

#             user, created = User.objects.get_or_create(email=email, defaults={"full_name": full_name, "is_active": True, "is_email_verified": True})
            
#             refresh = RefreshToken.for_user(user)
#             return Response({
#                 "success": True,
#                 "access": (str(refresh.access_token)),
#                 "refresh": (str(refresh)),
#                 "email": user.email
#             })
#         except Exception as e:
#             return Response({"error": str(e)}, status=400)


# class FacebookLoginAPIView(APIView):
#     permission_classes = [AllowAny]

#     def post(self, request):
#         access_token = request.data.get("access_token")
#         if not access_token:
#             return Response({"error": _("Missing access_token")}, status=status.HTTP_400_BAD_REQUEST)

#         try:
#             debug_url = f"https://graph.facebook.com/debug_token?input_token={access_token}&access_token={FB_APP_ID}|{FB_APP_SECRET}"
#             debug_resp = pyrequests.get(debug_url).json()
#             if not debug_resp.get("data", {}).get("is_valid"):
#                 return Response({"error": _("Invalid Facebook token")}, status=status.HTTP_400_BAD_REQUEST)

#             user_info = pyrequests.get(
#                 f"https://graph.facebook.com/me?fields=id,name,email&access_token={access_token}"
#             ).json()

#             email = user_info.get("email") or f"{user_info['id']}@facebook.com"
#             name = user_info.get("name", "")


#             user, created = User.objects.get_or_create(email=email, defaults={"username": email, "is_active": True, "is_email_verified": True , "full_name": name})
#             refresh = RefreshToken.for_user(user)
#             return Response({
#                 "success": True,
#                 "access": (str(refresh.access_token)),
#                 "refresh": (str(refresh)),
#                 "email": user.email
#             })
#         except Exception as e:
#             return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)





# class UpdateFcmTokenAPIView(APIView):
#     permission_classes = [IsAuthenticated]
#     def post(self, request):
#         user = request.user
#         fcm_token = request.data.get("fcm_token")

#         if not fcm_token:
#             return Response(
#                 {"error": "fcm_token is required"},
#                 status=status.HTTP_400_BAD_REQUEST
#             )

#         # ✅ update user fcm_token
#         user.fcm_token = fcm_token
#         user.save(update_fields=["fcm_token"])

#         return Response(
#             {
#                 "success": True,
#                 "user": user.email,
#                 "fcm_token": user.fcm_token
#             },
#             status=status.HTTP_200_OK
#         )