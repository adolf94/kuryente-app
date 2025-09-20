import os
import requests
import logging
import jwt
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests




def exchange_code_for_tokens(code: str) -> dict | None:
    """
    Exchanges an authorization code for Google API tokens.
    """
    client_id = os.environ.get("GOOGLE_CLIENT_ID", "")
    client_secret = os.environ.get("GOOGLE_CLIENT_SECRET", "")
    redirect_uri = os.environ.get("GOOGLE_REDIRECT_URI", "")

    if not all([client_id, client_secret, redirect_uri]):
        logging.error("Google API credentials are not configured.")
        return None

    token_url = "https://oauth2.googleapis.com/token"
    token_payload = {
        "code": code,
        "client_id": client_id,
        "scope": "openid https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email",
        "client_secret": client_secret,
        "redirect_uri": redirect_uri,
        "grant_type": "authorization_code",
    }
    headers = {'Content-Type': 'application/x-www-form-urlencoded'}
    try:
        token_response = requests.post(token_url, data=token_payload, headers=headers)
        token_response.raise_for_status()
        return token_response.json()
    except requests.exceptions.RequestException as e:
        logging.error(f"Error exchanging code for tokens: {e}")
        return None

def get_user_info(access_token: str) -> dict | None:
    """
    Fetches user information from Google using an access token.
    """
    userinfo_url = "https://www.googleapis.com/oauth2/v3/userinfo"
    headers = {"Authorization": f"Bearer {access_token}"}
    
    try:
        userinfo_response = requests.get(userinfo_url, headers=headers)
        userinfo_response.raise_for_status()
        return userinfo_response.json()
    except requests.exceptions.RequestException as e:
        logging.error(f"Error fetching user info: {e}")
        return None

def verify_google_jwt(token: str) -> dict | None:
    """
    Verifies a Google ID token (JWT) and returns the user information.
    """
    client_id = os.environ.get("GOOGLE_CLIENT_ID")
    if not client_id:
        logging.error("Google Client ID is not configured.")
        return None

    try:
        # Specify the CLIENT_ID of the app that accesses the backend
        id_info = id_token.verify_oauth2_token(
            token, google_requests.Request(), client_id
        )
        return id_info
    except ValueError as e:
        # Invalid token
        logging.error(f"Error verifying Google JWT: {e}")
        return None

def verify_custom_jwt(auth_header: str | None) -> dict | None:
    """
    Verifies a custom-issued JWT from an Authorization header.

    This function assumes your application issues its own JWTs after an initial
    authentication. These JWTs are signed with a secret key (symmetric),
    and this function uses the same secret to verify them.

    Requires the following environment variables to be set:
    - JWT_SECRET: The secret for verifying the JWT signature.
    - GOOGLE_CLIENT_ID: The expected audience claim of the JWT.
    """
    if not auth_header or not auth_header.startswith("Bearer "):
        logging.error("Authorization header is missing or invalid.")
        return None

    token = auth_header.split(" ")[1]
    
    secret = os.environ.get("JWT_SECRET")
    audience = os.environ.get("GOOGLE_CLIENT_ID")
    issuer = "https://adolfrey.com"

    if not secret or not audience:
        logging.error("JWT validation credentials (secret, audience) are not configured.")
        return None

    try:
        # HS256 is assumed as the signing algorithm.
        decoded_token = jwt.decode(
            token,
            secret,
            algorithms=["HS256"],
            audience=audience,
            issuer=issuer,
        )
        return decoded_token
    except jwt.PyJWTError as e:
        logging.error(f"Error verifying custom JWT: {e}")
        return None