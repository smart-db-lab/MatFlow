import jwt
from rest_framework_simplejwt.settings import api_settings
from rest_framework.exceptions import AuthenticationFailed


def extract_data_from_token(request):
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Token "):
        raise AuthenticationFailed("Authorization header is missing or invalid.")
    token = auth_header.split(" ")[1]
    try:
        payload = jwt.decode(
            token,
            api_settings.SIGNING_KEY,
            algorithms=[api_settings.ALGORITHM]
        )
        return {
            "email": payload.get("email"),
            "role": payload.get("role"),
            "exp": payload.get("exp"),
            "token_type": payload.get("token_type"),
        }
    except jwt.ExpiredSignatureError:
        raise AuthenticationFailed("Token has expired.")
    except jwt.InvalidTokenError:
        raise AuthenticationFailed("Invalid token.")