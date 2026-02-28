from rest_framework_simplejwt.views import  TokenRefreshView , TokenVerifyView
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.exceptions import TokenError
    
class CustomTokenRefreshView(TokenRefreshView):
    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        try:
            serializer.is_valid(raise_exception=True)
            return Response({
                "success": True,
                "message": "Token refreshed successfully",
                "access": serializer.validated_data['access']
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"success": False, "message": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class CustomTokenVerifyView(TokenVerifyView):
    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        try:
            serializer.is_valid(raise_exception=True)
            return Response({
                "success": True,
                "message": "Token is valid",
            }, status=status.HTTP_200_OK)
        except TokenError as e:
            return Response({
                "success": False,
                "message": "Token is invalid or expired",
            }, status=status.HTTP_401_UNAUTHORIZED)
