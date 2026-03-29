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

def verify_custom_jwt(auth_header: str | None) -> dict | None:
    """
    Verifies an OIDC token from the Authorization header using Atlas-Auth.
    """
    if not auth_header or not auth_header.startswith("Bearer "):
        logging.error("Authorization header is missing or invalid.")
        return None

    token = auth_header.split(" ")[1]
    jwks = get_jwks()
    if not jwks:
        return None

    try:
        # Get the unverified header to find the kid (Key ID)
        header = jwt.get_unverified_header(token)
        kid = header.get("kid")
        if not kid:
            logging.error("Token header missing 'kid'.")
            return None

        # Find the matching JWK
        jwk = next((key for key in jwks["keys"] if key["kid"] == kid), None)
        if not jwk:
            logging.error(f"No matching JWK found for kid: {kid}")
            return None

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

        return decoded_token
    except jwt.ExpiredSignatureError:
        logging.error("Token has expired.")
        return None
    except jwt.InvalidTokenError as e:
        logging.error(f"Invalid token: {e}")
        return None
    except Exception as e:
        logging.error(f"Error verifying Atlas-Auth JWT: {e}")
        return None

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