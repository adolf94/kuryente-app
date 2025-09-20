
import os
import requests


BASE_URL = os.environ["SMS_GATEWAY"]    
API_KEY = os.environ["SMS_APIKEY"]
DEVICE_ID = os.environ["SMS_DEVICE_ID"]
ENABLED = os.environ["SMS_ENABLED"].lower() == "true"


def send_sms(number, message):
    if(bool(ENABLED) == False): 
        return
    response = requests.post(
    f'{BASE_URL}/gateway/devices/{DEVICE_ID}/send-sms',
        json={
            'recipients': [number],
            'message': message
        },
        headers={'x-api-key': API_KEY}
    )

    print(response.json())
