from rest_framework.response import Response
from rest_framework import status

class ResponseMixin:
    def success_response(self, data=None, status_code=status.HTTP_200_OK):
        return Response({
            "success": True,
            "data": data
        }, status=status_code)

    def error_response(self, errors=None, status_code=status.HTTP_400_BAD_REQUEST):
        return Response({
            "success": False,
            "error": errors
        }, status=status_code)
