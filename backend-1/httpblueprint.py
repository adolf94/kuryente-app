# Register this blueprint by adding the following line of code 
# to your entry point file.  
# app.register_functions(httpblueprint) 
# 
# Please refer to https://aka.ms/azure-functions-python-blueprints


import json
import os
import azure.functions as func
import logging
import jwt
import requests
import datetime

from deps.cosmosdb import get_latest_from_container
from deps.google_auth import exchange_code_for_tokens

bp = func.Blueprint()


@bp.route(route="get_timer_info", auth_level=func.AuthLevel.ANONYMOUS)
def get_timer_info(req: func.HttpRequest) -> func.HttpResponse:
    logging.info('Python HTTP trigger function processed a request.')


    item = get_latest_from_container("TimerDetails")
    body = json.dumps(item)
    return func.HttpResponse(body, status_code=200, mimetype="application/json")

@bp.route(route="auth/google_credential", methods=["POST"], auth_level=func.AuthLevel.ANONYMOUS)
def google_creds_proxy(req:func.HttpRequest) -> func.HttpResponse:
    if "AUTH_API" not in os.environ:
        return func.HttpResponse("",status_code=400, mimetype="application/json")
    auth_api = f"{os.environ["AUTH_API"]}/auth/google_credential"
    body = req.get_json()
    response = requests.post(auth_api, headers={"Content-Type": "application/json"} ,json=body)
    
    return func.HttpResponse(response.text, status_code=response.status_code, mimetype="application/json")


@bp.route(route="auth/refresh", methods=["POST"], auth_level=func.AuthLevel.ANONYMOUS)
def refresh_proxy(req:func.HttpRequest) -> func.HttpResponse:
    if "AUTH_API" not in os.environ:
        return func.HttpResponse("",status_code=400, mimetype="application/json")
    auth_api = f"{os.environ["AUTH_API"]}/auth/refresh"
    body = req.get_json()
    response = requests.post(auth_api, headers={"Content-Type": "application/json"} ,json=body)
    
    return func.HttpResponse(response.text, status_code=response.status_code, mimetype="application/json")




@bp.route(route="google/auth", auth_level=func.AuthLevel.ANONYMOUS)
def google_auth(req: func.HttpRequest) -> func.HttpResponse:

    try:
        req_body = req.get_json()
    except ValueError:
        return func.HttpResponse(
             "Please pass a JSON body",
             status_code=400
        )

    code = req_body.get('code')
    if not code:
        return func.HttpResponse(
            "Please pass 'code' in the request body",
            status_code=400
        )

    token_data = exchange_code_for_tokens(code)

    if not token_data:
        return func.HttpResponse(
            "Failed to exchange authorization code for tokens.",
            status_code=400
        )

    id_token_from_google = token_data.get("id_token")
    if not id_token_from_google:
        return func.HttpResponse(
            "id_token not found in Google's response.",
            status_code=500
        )

    # Decode the id_token from Google to get the user's claims.
    # We disable signature verification because we trust the token endpoint,
    # but in a more secure setup, you'd verify it with Google's public keys.
    try:
        google_claims = jwt.decode(id_token_from_google, options={"verify_signature": False})
    except jwt.PyJWTError as e:
        logging.error(f"Error decoding Google id_token: {e}")
        return func.HttpResponse(f"Invalid id_token from Google: {e}", status_code=500)


    # Get secret for signing our new token
    jwt_secret = os.environ.get("JWT_SECRET")
    if not jwt_secret:
        logging.error("JWT_SECRET is not configured.")
        return func.HttpResponse(
            "Internal server error: JWT secret not set.",
            status_code=500
        )

    # Create a new payload for our application's token
    now = datetime.datetime.now(tz=datetime.timezone.utc)
    role = "admin" if google_claims.get('email') == os.environ["ADMIN_USER"] else "user"
    payload = {
        'iat': now,
        'exp': now + datetime.timedelta(hours=6),
        'iss': 'https://adolfrey.com',
        "aud": google_claims.get('aud'),
        'sub': google_claims.get('sub'),
        'name': google_claims.get('name'),
        'email': google_claims.get('email'),
        'picture': google_claims.get('picture'),
        'role': role # Add custom claim
    }

    # Create new tokens signed with our secret
    new_access_token = jwt.encode(payload, jwt_secret, algorithm="HS256")
    new_id_token = jwt.encode(payload, jwt_secret, algorithm="HS256")

    response_data = {
        'access_token': new_access_token,
        'id_token': new_id_token,
        'user_info': {
            'sub': payload['sub'],
            'name': payload['name'],
            'email': payload['email'],
            'picture': payload['picture'],
            'role': payload['role']
        }
    }
    
    return func.HttpResponse(
        json.dumps(response_data, default=str),
        status_code=200,
        mimetype="application/json"
    )
        

