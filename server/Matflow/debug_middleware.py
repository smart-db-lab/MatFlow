from django.conf import settings
from .debug_utilities import set_debug_level, DEBUG, INFO, WARNING, ERROR, CRITICAL

class DebugMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

        # Set the debug level based on Django's DEBUG setting
        if hasattr(settings, 'DEBUG_LEVEL'):
            set_debug_level(settings.DEBUG_LEVEL)
        else:
            # Default to INFO in production, DEBUG in development
            if settings.DEBUG:
                set_debug_level(DEBUG)
            else:
                set_debug_level(INFO)

    def __call__(self, request):
        # You can add request-level debugging here if needed
        response = self.get_response(request)
        return response
