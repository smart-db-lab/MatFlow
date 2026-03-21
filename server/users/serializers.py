import re

from rest_framework import serializers
from django.core.validators import RegexValidator
from django.contrib.auth import authenticate
from django.contrib.auth.hashers import is_password_usable
from django.utils.translation import gettext as _

from .models import User, OTP, UserActionToken


class UserSerializer(serializers.ModelSerializer):
    profile_image_url = serializers.SerializerMethodField()
    profile_image = serializers.FileField(required=False, allow_null=True)
    
    class Meta:
        model = User
        fields = [
            'id',
            'email',
            'username',
            'first_name',
            'last_name',
            'full_name',
            'password',
            'phone_number',
            'profile_image',
            'profile_image_url',
            'is_superuser',
            'is_active',
            'is_staff',
            'date_joined',
            'last_login',
        ]
        extra_kwargs = {
            'password': {'write_only': True},
            'is_superuser': {'read_only': True},
            'is_staff': {'read_only': True},
            'is_active': {'read_only': False},
            'last_login': {'read_only': True},
            'date_joined': {'read_only': True},
        }
    
    def get_profile_image_url(self, obj):
        if obj.profile_image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.profile_image.url)
            return obj.profile_image.url
        return None

    def validate_profile_image(self, value):
        content_type = (getattr(value, "content_type", "") or "").lower()
        if content_type and not content_type.startswith("image/"):
            raise serializers.ValidationError(_("Please upload an image file."))
        return value
    
    def validate_email(self, value):
        # Email format and uniqueness check
        if '@' not in value or '.' not in value.split('@')[-1]:
            raise serializers.ValidationError(_("Invalid email format."))
        
        email = value.lower()
        existing = User.objects.filter(email=email)
        if self.instance:
            existing = existing.exclude(pk=self.instance.pk)
        if existing.exists():
            raise serializers.ValidationError(_("User with this email already exists."))
        return email

    def validate(self, data):
        password = data.get('password')

        if not self.instance:
            if not data.get('email') or not password:
                raise serializers.ValidationError({"error": _("Email and password are required.")})
            if not (data.get('first_name') or '').strip():
                raise serializers.ValidationError({"first_name": _("First name is required.")})
            if not (data.get('last_name') or '').strip():
                raise serializers.ValidationError({"last_name": _("Last name is required.")})

        if password:
            if len(password) < 8:
                raise serializers.ValidationError({"password": _("Password must be at least 8 characters long.")})

        return data

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        first_name = (validated_data.get('first_name') or '').strip()
        last_name = (validated_data.get('last_name') or '').strip()
        validated_data['first_name'] = first_name
        validated_data['last_name'] = last_name
        validated_data['full_name'] = f"{first_name} {last_name}".strip()
        if not validated_data.get('username') and validated_data.get('email'):
            email_local_part = validated_data['email'].split('@')[0]
            username = re.sub(r'[^a-zA-Z0-9_.-]', '_', email_local_part).strip('._-')[:100]
            validated_data['username'] = username or 'user'
        user = User(**validated_data)
        if password:
            user.set_password(password)
        user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if 'first_name' in validated_data or 'last_name' in validated_data:
            instance.first_name = (instance.first_name or '').strip()
            instance.last_name = (instance.last_name or '').strip()
            instance.full_name = f"{instance.first_name} {instance.last_name}".strip()
        elif 'full_name' in validated_data and validated_data.get('full_name') and not (
            validated_data.get('first_name') or validated_data.get('last_name')
        ):
            parts = str(validated_data.get('full_name')).strip().split()
            instance.first_name = parts[0] if parts else ""
            instance.last_name = " ".join(parts[1:]) if len(parts) > 1 else ""
        if password:
            instance.set_password(password)
        instance.save()
        return instance    


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        email = data.get('email')
        password = data.get('password')
        
        if not email or not password:
            raise serializers.ValidationError({"error": _("Email and password are required.")})

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise serializers.ValidationError({"error": _("User with this email does not exist.")})

        if not is_password_usable(user.password):
            raise serializers.ValidationError({"error": _("Password is corrupted. Please reset your password.")})

        user = authenticate(username=email, password=password)
        if not user:
            raise serializers.ValidationError({"error": _("Invalid credentials.")})

        if not user.is_active:
            raise serializers.ValidationError({"error": _("Account is not active.")})

        if not user.is_email_verified:
            raise serializers.ValidationError({"error": _("Email is not verified. Check your email.")})

        login_type = self.context.get("login_type", "user")
        is_admin = user.is_superuser or user.is_staff

        if login_type == "user" and is_admin:
            raise serializers.ValidationError({
                "error": _("No matching user found. Please check your credentials.")
            })

        if login_type == "admin" and not is_admin:
            raise serializers.ValidationError({
                "error": _("You do not have admin access.")
            })

        data['user'] = user
        return data


class VerifyOTPSerializer(serializers.Serializer):
    email = serializers.EmailField()
    code = serializers.CharField(max_length=6)
    purpose = serializers.ChoiceField(choices=OTP.PURPOSE)

    def validate(self, data):
        email = (data.get('email') or '').strip().lower()
        code = (data.get('code') or '').strip()
        purpose = data.get('purpose')

        if not code.isdigit() or len(code) != 6:
            raise serializers.ValidationError(_("OTP code must be exactly 6 digits."))

        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            raise serializers.ValidationError(_("User with this email does not exist."))

        otp = OTP.objects.filter(
            user=user,
            purpose=purpose,
            is_used=False,
        ).order_by('-created_at').first()
        if not otp:
            raise serializers.ValidationError(_("No active OTP found for this purpose."))

        if otp.is_expired():
            raise serializers.ValidationError(_("OTP has expired."))

        if otp.is_blocked():
            raise serializers.ValidationError(_("Too many failed attempts. OTP is blocked."))

        if not otp.check_code(code):
            otp.attempt_count += 1
            otp.save()
            raise serializers.ValidationError(_("Invalid OTP code."))

        data['email'] = email
        data['user'] = user
        data['otp'] = otp
        return data


class ResetPasswordWithTokenSerializer(serializers.Serializer):
    token = serializers.CharField(max_length=128)
    new_password = serializers.CharField(min_length=8, write_only=True)
    confirm_password = serializers.CharField(min_length=8, write_only=True)

    def validate(self, data):
        token = data.get('token')
        new_password = data.get('new_password')
        confirm_password = data.get('confirm_password')

        if new_password != confirm_password:
            raise serializers.ValidationError(_("Passwords do not match."))

        try:
            action_token = UserActionToken.objects.get(token=token, purpose="password_reset", is_used=False)
        except UserActionToken.DoesNotExist:
            raise serializers.ValidationError(_("Invalid or expired reset token."))

        if action_token.is_expired():
            raise serializers.ValidationError(_("Reset token has expired."))

        data['user'] = action_token.user
        data['action_token'] = action_token
        return data