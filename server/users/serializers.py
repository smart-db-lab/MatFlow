from rest_framework import serializers
from django.core.validators import RegexValidator
from .models import *
from django.contrib.auth import authenticate
from django.utils.translation import gettext as _


class UserSerializer(serializers.ModelSerializer):
    profile_image_url = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id',
            'email',
            'username',
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
    
    def validate_email(self, value):
        # During updates, allow the same email for the current instance
        existing = User.objects.filter(email=value)
        if self.instance:
            existing = existing.exclude(pk=self.instance.pk)
        if existing.exists():
            raise serializers.ValidationError(_("User with this email already exists."))
        if '@' not in value or '.' not in value.split('@')[-1]:
            raise serializers.ValidationError(_("Invalid email format. It must contain '@' and a domain (e.g., '.com')."))
        return value

    def validate(self, data):
        email = data.get('email')
        password = data.get('password')

        # For create, require both email and password and enforce uniqueness/format
        if not self.instance:
            if not email or not password:
                raise serializers.ValidationError({"email": _("Email and password are required.")})

            if email and ('@' not in email or '.' not in email.split('@')[-1]):
                raise serializers.ValidationError({"email": _("Invalid email format. It must contain '@' and a domain (e.g., '.com').")})

            if User.objects.filter(email=email).exists():
                raise serializers.ValidationError({"email": _("User with this email already exists.")})

        if password:
            password_errors = []
            if len(password) < 8:
                password_errors.append(_("Password must be at least 8 characters long."))
            # if not any(char.isdigit() for char in password):
            #     password_errors.append("Password must contain at least one numeric character.")
            # if not any(char.isalpha() for char in password):
            #     password_errors.append("Password must contain at least one alphabetic character.")
            # if not any(char in "!@#$%^&*()-_+=<>" for char in password):
            #     password_errors.append("Password must contain at least one special character.")
            # if not any(char.isupper() for char in password):
            #     password_errors.append("Password must contain at least one uppercase letter.")

            if password_errors:
                raise serializers.ValidationError({"password": password_errors})

        return data

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        user = User(**validated_data)
        if password:
            user.set_password(password)
        user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if password:
            instance.set_password(password)
        
        instance.save()
        return instance    



from django.contrib.auth.hashers import is_password_usable
class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        email = data.get('email')
        password = data.get('password')
        print(email,password)
        if not email or not password:
            raise serializers.ValidationError({"error": _("Email and password are required.")})

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise serializers.ValidationError({"error": _("User with this email does not exist.")})

        # ✅ Ensure password is not NULL or corrupted
        if not is_password_usable(user.password):
            raise serializers.ValidationError({"error": _("Password is corrupted. Please reset your password.")})

        user = authenticate(username=email, password=password)
        if not user:
            raise serializers.ValidationError({"error": _("Invalid credentials.")})

        if not user.is_active:
            raise serializers.ValidationError({"error": _("Account is not active.")})

        if not user.is_email_verified:
            raise serializers.ValidationError({"error": _("Email is not verified. Check your email.")})

        data['user'] = user
        return data





    
    