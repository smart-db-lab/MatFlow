from rest_framework.exceptions import PermissionDenied

def validate_roles(user, allowed_roles=None, allowed_teacher_roles=None):

    if allowed_roles and user.role and user.role.name in allowed_roles:
        return True

    if allowed_teacher_roles:
        teacher_roles = [role.name for role in user.teacher_roles.all()]
        if any(role in allowed_teacher_roles for role in teacher_roles):
            return True

    if allowed_roles and allowed_teacher_roles:
        raise PermissionDenied(
            f"Only users with roles ({', '.join(allowed_roles)}) or teacher roles "
            f"({', '.join(allowed_teacher_roles)}) are allowed to perform this action."
        )
    elif allowed_roles:
        raise PermissionDenied(f"Only users with roles ({', '.join(allowed_roles)}) are allowed.")
    elif allowed_teacher_roles:
        raise PermissionDenied(f"Only users with teacher roles ({', '.join(allowed_teacher_roles)}) are allowed.")
