import os
import json
from django.core.management.base import BaseCommand, CommandError
from django.conf import settings
from common.models import Role, Department, TeacherRole, Session 
from users.models import User


class Command(BaseCommand):
    help = "Load Role, Department, TeacherRole, and Session data from a JSON file into the database"

    def handle(self, *args, **kwargs):
        # Path to the JSON file
        json_file_path = os.path.join(settings.BASE_DIR, "import.json")

        # Check if the file exists
        if not os.path.exists(json_file_path):
            raise CommandError(f"JSON file not found: {json_file_path}")

        # Load the JSON file
        with open(json_file_path, "r") as file:
            data = json.load(file)

        # Iterate over the JSON data
        for obj in data:
            model = obj.get("model")
            pk = obj.get("pk")
            fields = obj.get("fields")

            try:
                if model == "common.role":
                    role, created = Role.objects.update_or_create(
                        id=pk,
                        defaults={
                            "name": fields.get("name"),
                        },
                    )
                    self.stdout.write(
                        self.style.SUCCESS(f"Role '{role.name}' imported successfully!")
                    )

                elif model == "common.department":
                    department, created = Department.objects.update_or_create(
                        id=pk,
                        defaults={
                            "name": fields.get("name"),
                        },
                    )
                    self.stdout.write(
                        self.style.SUCCESS(
                            f"Department '{department.name}' imported successfully!"
                        )
                    )

                elif model == "common.teacherrole":
                    teacher_role, created = TeacherRole.objects.update_or_create(
                        id=pk,
                        defaults={
                            "name": fields.get("name"),
                        },
                    )
                    self.stdout.write(
                        self.style.SUCCESS(
                            f"Teacher Role '{teacher_role.name}' imported successfully!"
                        )
                    )

                elif model == "common.session":
                    session, created = Session.objects.update_or_create(
                        id=pk,
                        defaults={
                            "name": fields.get("name"),
                            "start_date": fields.get("start_date"),
                            "end_date": fields.get("end_date"),
                        },
                    )
                    self.stdout.write(
                        self.style.SUCCESS(
                            f"Session '{session.name}' imported successfully!"
                        )
                    )
                # elif model == "users.user":
                #     user, created = User.objects.update_or_create(
                #     id=pk,
                #     defaults={
                #         "full_name": fields.get("full_name"),
                #         "email": fields.get("email"),
                #         "role": Role.objects.get(pk=fields.get("role")),
                #         "department": Department.objects.get(pk=fields.get("department")) if fields.get("department") else None,
                #         "session": Session.objects.get(pk=fields.get("session")) if fields.get("session") else None,
                #         "is_email_verified": fields.get("is_email_verified"),
                #         "is_staff": fields.get("is_staff") if fields.get("is_staff") else False,
                #         "is_superuser": fields.get("is_superuser") if fields.get("is_superuser") else False,
                #         "password": fields.get("password") if fields.get("password") else "password",
                #         "verification_token": fields.get("verification_token"),
                #         "phone_number": fields.get("phone_number"),
                #     },
                #     )
                #     # Handle ManyToManyField for teacher_roles
                #     if fields.get("teacher_roles"):
                #         teacher_roles = TeacherRole.objects.filter(pk__in=fields.get("teacher_roles"))
                #         user.teacher_roles.set(teacher_roles)
                #     self.stdout.write(
                #             self.style.SUCCESS(f"User '{user.email}' imported successfully!")
                #         )

                else:
                    self.stdout.write(
                        self.style.WARNING(f"Unknown model '{model}', skipping.")
                    )

            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f"Failed to import {model} with ID {pk}: {str(e)}")
                )
