"""
This module provides a Python implementation for Tuya API signing,
converted from a Postman pre-request script.
"""

import os
import time
import hmac
import hashlib
import json
from urllib.parse import urlparse, parse_qsl


TUYA_ENDPOINT = os.environ["TUYA_ENDPOINT"]
TUYA_CLIENT_ID = os.environ["TUYA_CLIENT_ID"]
TUYA_SECRET = os.environ["TUYA_SECRET"]







class TuyaSigner:
    """
    Handles the signing process for Tuya API requests.

    This class implements the signature algorithm required by the Tuya IoT Platform,
    which involves creating a HMAC-SHA256 signature from request parameters.

    It supports two signing modes:
    1.  For acquiring an access token.
    2.  For making authenticated API calls using an access token.
    """
    def __init__(self, client_id: str, secret: str):
        """
        Initializes the signer with Tuya API credentials.

        Args:
            client_id: Your Tuya project's Client ID.
            secret: Your Tuya project's Secret.
        """
        self.client_id = client_id
        self.secret = secret.encode('utf-8')

    def _get_timestamp(self) -> str:
        """Returns the current time in milliseconds as a string."""
        return str(int(time.time() * 1000))

    def _calculate_sign_for_token(self, timestamp: str, nonce: str, sign_str: str) -> str:
        """
        Calculates the signature for token acquisition requests.
        The signature string is: client_id + timestamp + nonce + sign_str
        """
        message = self.client_id + timestamp + nonce + sign_str
        signature = hmac.new(
            self.secret,
            msg=message.encode('utf-8'),
            digestmod=hashlib.sha256
        ).hexdigest().upper()
        return signature

    def _calculate_sign_with_token(self, access_token: str, timestamp: str, nonce: str, sign_str: str) -> str:
        """
        Calculates the signature for business API calls.
        The signature string is: client_id + access_token + timestamp + nonce + sign_str
        """
        message = self.client_id + access_token + timestamp + nonce + sign_str
        signature = hmac.new(
            self.secret,
            msg=message.encode('utf-8'),
            digestmod=hashlib.sha256
        ).hexdigest().upper()
        return signature

    def _build_string_to_sign(self, method: str, url: str, body: dict | None, headers: dict) -> tuple[str, str]:
        """
        Constructs the canonical string that needs to be signed.

        The string format is:
        HTTP_METHOD\n
        content-sha256\n
        headers\n
        url

        Returns:
            A tuple containing the string to sign and the canonicalized URL path with query.
        """
        parsed_url = urlparse(url)
        query_params = dict(parse_qsl(parsed_url.query))
        
        body_for_sha = b''
        
        content_type = headers.get('Content-Type', 'application/json')
        if body:
            if 'application/json' in content_type:
                # For JSON body, the body content is hashed.
                body_for_sha = json.dumps(body).encode('utf-8')
            elif 'x-www-form-urlencoded' in content_type or 'multipart/form-data' in content_type:
                # For form data, the form fields are added to the parameters for signing,
                # and the hashed body is an empty string.
                query_params.update(body)
        
        sha256_body = hashlib.sha256(body_for_sha).hexdigest()
        print(sha256_body)
        # Sort all query and form parameters by key
        sorted_query_keys = sorted(query_params.keys())
        
        encoded_query_parts = []
        for key in sorted_query_keys:
            encoded_query_parts.append(f"{key}={query_params[key]}")
        
        encoded_query = "&".join(encoded_query_parts)

        path_with_query = parsed_url.path
        if encoded_query:
            path_with_query += "?" + encoded_query

        # Handle Signature-Headers
        headers_str = ""
        if "Signature-Headers" in headers:
            sign_header_keys = headers["Signature-Headers"].split(":")
            for key in sign_header_keys:
                val = headers.get(key, "")
                headers_str += f"{key}:{val}\n"

        string_to_sign = f"{method.upper()}\n{sha256_body}\n{headers_str}\n{path_with_query}"
        
        return string_to_sign, path_with_query

    def get_headers_for_token(self, method: str, url: str, body: dict | None = None, headers: dict | None = None) -> dict:
        """
        Generates the required headers for a token acquisition request.

        Args:
            method: The HTTP method (e.g., "GET", "POST").
            url: The full request URL.
            body: The request body as a dictionary (if any).
            headers: The request headers as a dictionary (if any).

        Returns:
            A dictionary of headers to be included in the request.
        """
        if headers is None:
            headers = {}
        
        timestamp = self._get_timestamp()
        nonce = headers.get("nonce", "")

        string_to_sign, _ = self._build_string_to_sign(method, url, body, headers)
        
        sign = self._calculate_sign_for_token(timestamp, nonce, string_to_sign)

        signed_headers = {
            "client_id": self.client_id,
            "t": timestamp,
            "sign": sign,
            "sign_method": "HMAC-SHA256",
        }
        if nonce:
            signed_headers["nonce"] = nonce
            
        return signed_headers

    def get_headers_for_api_call(self, method: str, url: str, access_token: str, body: dict | None = None, headers: dict | None = None) -> dict:
        """
        Generates the required headers for a standard API call.

        Args:
            method: The HTTP method (e.g., "GET", "POST").
            url: The full request URL.
            access_token: The access token obtained from the token endpoint.
            body: The request body as a dictionary (if any).
            headers: The request headers as a dictionary (if any).

        Returns:
            A dictionary of headers to be included in the request.
        """
        if headers is None:
            headers = {}

        timestamp = self._get_timestamp()
        nonce = headers.get("nonce", "")

        string_to_sign, _ = self._build_string_to_sign(method, url, body, headers)
        sign = self._calculate_sign_with_token(access_token, timestamp, nonce, string_to_sign)

        signed_headers = {
            "client_id": self.client_id,
            "access_token": access_token,
            "t": timestamp,
            "sign": sign,
            "sign_method": "HMAC-SHA256",
        }
        if nonce:
            signed_headers["nonce"] = nonce
            
        return signed_headers

# Example usage:
if __name__ == '__main__':
    # Replace with your client_id and secret
    CLIENT_ID = "your_client_id"
    SECRET = "your_secret"
    
    # Base URL for Tuya API
    BASE_URL = "https://openapi.tuya.com"

    signer = TuyaSigner(client_id=CLIENT_ID, secret=SECRET)

    # 1. Example for getting an access token
    print("--- Getting access token ---")
    token_method = "GET"
    token_path = "/v1.0/token"
    # The URL that would be used in the request
    token_url = f"{BASE_URL}{token_path}?grant_type=1"
    
    # Generate the signed headers
    token_headers = signer.get_headers_for_token(method=token_method, url=token_url)
    
    print(f"Request URL: {token_url}")
    print("Generated Headers:")
    for k, v in token_headers.items():
        print(f"  {k}: {v}")
    
    # In a real application, you would now make an HTTP request with these headers.
    # For example:
    # import requests
    # response = requests.get(token_url, headers=token_headers)
    # print(response.json())
    
    # This is a mock response for demonstration purposes.
    mock_token_response = {
        "result": {
            "access_token": "mock_access_token_from_response",
            "expire_time": 7200,
            "refresh_token": "mock_refresh_token",
            "uid": "mock_uid"
        },
        "success": True,
        "t": int(time.time() * 1000)
    }
    access_token = mock_token_response["result"]["access_token"]
    print(f"\nSuccessfully mocked receiving access token: {access_token}\n")


    # 2. Example for an API call with the access token (e.g., get user info)
    print("--- Making API call with access token ---")
    api_method = "GET"
    # Example path, replace with a real one
    api_path = "/v1.0/users/some_user_id" 
    api_url = f"{BASE_URL}{api_path}"
    
    # For GET requests, body is None. For POST/PUT with JSON, it would be a dict.
    api_body = None 
    
    # Generate the signed headers for the API call
    api_headers = signer.get_headers_for_api_call(
        method=api_method, 
        url=api_url, 
        access_token=access_token,
        body=api_body
    )

    print(f"Request URL: {api_url}")
    print("Generated Headers:")
    for k, v in api_headers.items():
        print(f"  {k}: {v}")
        
    # In a real application, you would now make the API request:
    # import requests
    # response = requests.get(api_url, headers=api_headers)
    # print(response.json())