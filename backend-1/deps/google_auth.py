import os
import requests
import logging
import jwt
import datetime
from jwt.algorithms import RSAAlgorithm

# Cache for JWKS to avoid repeated lookups
_jwks_cache = None

def get_jwks():
    """
    Fetches JWKS from the authority to get public keys for token verification.
    """
    global _jwks_cache
    if _jwks_cache is None:
        authority = os.environ.get("ATLAS_AUTH_AUTHORITY", "https://auth.adolfrey.com/")
        jwks_url = f"{authority.rstrip('/')}/.well-known/jwks.json"
        try:
            logging.info(f"Fetching JWKS from {jwks_url}")
            response = requests.get(jwks_url, timeout=10)
            response.raise_for_status()
            _jwks_cache = response.json()
        except Exception as e:
            logging.error(f"Error fetching JWKS from {jwks_url}: {e}")
            return None
    return _jwks_cache

def verify_custom_jwt(auth_header: str | None) -> tuple[dict | None, str | None]:
    """
    Verifies an OIDC token from the Authorization header using Atlas-Auth.
    Returns (decoded_token, error_reason).
    """
    if not auth_header:
        return None, "Authorization header is missing."
    
    if not auth_header.startswith("Bearer "):
        return None, "Authorization header must start with 'Bearer '."

    token = auth_header.split(" ")[1]
    jwks = get_jwks()
    if not jwks:
        return None, "Could not fetch JWKS from authority."

    try:
        # Get the unverified header to find the kid (Key ID)
        header = jwt.get_unverified_header(token)
        kid = header.get("kid")
        if not kid:
            return None, "Token header missing 'kid'."

        # Find the matching JWK
        jwk = next((key for key in jwks["keys"] if key["kid"] == kid), None)
        if not jwk:
            return None, f"No matching JWK found for kid: {kid}"

        # Create public key from JWK
        public_key = RSAAlgorithm.from_jwk(jwk)

        # Decode and verify the token
        # audience is expected to be the Client ID
        # issuer should match the authority
        audience = os.environ.get("ATLAS_AUTH_AUDIENCE") or os.environ.get("GOOGLE_CLIENT_ID")
        authority = os.environ.get("ATLAS_AUTH_AUTHORITY", "https://auth.adolfrey.com/")
        
        decoded_token = jwt.decode(
            token,
            public_key,
            algorithms=["RS256"],
            audience=audience,
            issuer=authority
        )

        return decoded_token, None
    except jwt.ExpiredSignatureError:
        return None, "Token has expired."
    except jwt.InvalidTokenError as e:
        return None, f"Invalid token: {e}"
    except Exception as e:
        return None, f"Error verifying Atlas-Auth JWT: {str(e)}"

def has_scope(user: dict | None, scope_name: str) -> bool:
    """
    Checks if the user token contains the required scope.
    Handles the 'api://{audience}/' prefix mapping to 'https://{audience}/' or literal scopes.
    """
    if not user:
        return False
        
    scopes = user.get("scope", "")
    if isinstance(scopes, list):
        scopes = " ".join(scopes)
        
    audience = os.environ.get("ATLAS_AUTH_AUDIENCE", "kuryente-api")
    required_scope = f"api://{audience}/{scope_name}"
    
    # Check for both literal match and potential URL mappings if needed
    scope_list = scopes.split(" ")
    return required_scope in scope_list or f"https://{audience}/{scope_name}" in scope_list