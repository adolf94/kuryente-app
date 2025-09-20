




import hashlib
import json
import os
import requests
from .tuya_signer import TUYA_CLIENT_ID, TUYA_ENDPOINT, TUYA_SECRET, TuyaSigner


signer = TuyaSigner(client_id=TUYA_CLIENT_ID, secret=TUYA_SECRET)

TUYA_DEVICE_ID = os.environ["TUYA_DEVICE_ID"]
TUYA_ENABLED = os.environ["TUYA_ENABLED"]



def switch_device(shouldOn : bool):
    if(TUYA_ENABLED.lower() == "false"):
        return
    access_token = get_token()
    api_method = "POST"
    # Example path, replace with a real one
    api_path = f"/v1.0/iot-03/devices/{TUYA_DEVICE_ID}/commands" 
    api_url = f"{TUYA_ENDPOINT}{api_path}"

    body = {
        "commands": [
            {
            "code": "switch",
            "value": shouldOn
            }
        ]
    }
    
    
    api_headers = signer.get_headers_for_api_call(
        method=api_method, 
        url=api_url, 
        access_token=access_token,
        body=body
    )
    response = requests.post(api_url, headers=api_headers, json=body)

    response.raise_for_status()
    print(response.json())
    return


def get_token():
    

    # 1. Example for getting an access token
    token_path = "/v1.0/token"
    # The URL that would be used in the request
    token_url = f"{TUYA_ENDPOINT}{token_path}?grant_type=1"
    
    # Generate the signed headers
    token_headers = signer.get_headers_for_token(method="GET", url=token_url)
    
    response = requests.get(token_url, headers=token_headers)
    

    body  = response.json()
    access_token = body["result"]["access_token"]
    return access_token



