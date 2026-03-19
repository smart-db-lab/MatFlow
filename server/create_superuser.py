#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Matflow.settings')
django.setup()

from django.contrib.auth import get_user_model
from django.core.management import call_command

User = get_user_model()

# Get or create the superuser
user, created = User.objects.get_or_create(
    email='admin@mail.com',
    defaults={
        'full_name': 'Admin User',
        'is_staff': True,
        'is_superuser': True,
        'is_active': True,
    }
)

# Set/update the password
user.set_password('12345678')
user.is_staff = True
user.is_superuser = True
user.is_active = True
user.is_email_verified = True
user.save()

if created:
    print("Superuser created successfully!")
    print("Running seed data...")
    call_command('seed_data')
else:
    print("Superuser already exists - password updated!")

print(f"\nEmail: admin@mail.com")
print(f"Password: 12345678")
print(f"\nYou can now login at: http://localhost:9000/admin/")
