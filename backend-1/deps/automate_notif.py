
import os

import requests

def send_notification(summary_text, user_name):
        
    payload = {
    "secret": os.environ["AUTOMATE_KEY"],
    "to":  os.environ["AUTOMATE_EMAIL"],
    "device": None,
    "priority": "normal",
    "payload": {
        "action": "kuryente_ai_escalate",
        "user": user_name,
        "summary": summary_text 
        }
    }

    
    response = requests.post(os.environ["AUTOMATE_ENDPOINT"], json=payload)
