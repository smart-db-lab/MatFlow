from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone
from .managers import CustomUserManager
from datetime import timedelta
from django.contrib.auth.hashers import make_password, check_password
from core.SoftDeleteModel import SoftDeleteModel
from core.BaseModel import BaseModel


class User(AbstractUser, SoftDeleteModel, BaseModel):
    first_name = models.CharField(max_length=150, blank=True, default="")
    last_name = models.CharField(max_length=150, blank=True, default="")
    username = models.CharField(max_length=100, null=True, blank=True)
    full_name = models.CharField(max_length=100, null=True, blank=True)
    email = models.EmailField(max_length=150, unique=True)
    password = models.CharField(max_length=100, null=True, blank=True)
    profile_image = models.ImageField(upload_to='profile_images/', null=True, blank=True)
    is_email_verified = models.BooleanField(default=False)
    phone_number = models.CharField(max_length=15, null=True, blank=True)
    is_phone_verified = models.BooleanField(default=False)

    is_active = models.BooleanField(default=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["first_name", "last_name"]

    objects = CustomUserManager()

    def __str__(self):
        return self.email


class OTP(SoftDeleteModel, BaseModel):

    PURPOSE = (
        ("registration", "Registration"),
        ("password_reset", "Password Reset"),
    )

    user = models.ForeignKey(User, on_delete=models.CASCADE, db_index=True)
    code = models.CharField(max_length=128)
    purpose = models.CharField(max_length=20, choices=PURPOSE, db_index=True)

    is_used = models.BooleanField(default=False)
    attempt_count = models.IntegerField(default=0)

    class Meta:
        indexes = [
            models.Index(fields=["user", "purpose", "is_used"]),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=["user", "purpose"],
                condition=models.Q(is_used=False),
                name="unique_active_otp_per_purpose"
            )
        ]

    def set_code(self, raw_code):
        self.code = make_password(raw_code)

    def check_code(self, raw_code):
        return check_password(raw_code, self.code)

    def is_expired(self):
        return timezone.now() >= self.created_at + timedelta(minutes=5)

    def is_blocked(self):
        return self.attempt_count >= 5



import secrets
class UserActionToken(SoftDeleteModel, BaseModel):

    PURPOSE_CHOICES = (
        ("password_reset", "Password Reset"),
        ("profile_setup", "Profile Setup"),
    )

    user = models.ForeignKey(User, on_delete=models.CASCADE)
    token = models.CharField(max_length=128, unique=True)
    purpose = models.CharField(max_length=30, choices=PURPOSE_CHOICES)
    is_used = models.BooleanField(default=False)

    class Meta:
        indexes = [
            models.Index(fields=["token", "is_used"]),
        ]

    def save(self, *args, **kwargs):
        if not self.token:
            self.token = secrets.token_urlsafe(48)
        super().save(*args, **kwargs)

    def is_expired(self):
        if self.purpose == "password_reset":
            return timezone.now() > self.created_at + timedelta(minutes=30)
        if self.purpose == "profile_setup":
            return timezone.now() > self.created_at + timedelta(minutes=15)
        return True

    def __str__(self):
        return f"{self.user.email} - {self.purpose}"
    
