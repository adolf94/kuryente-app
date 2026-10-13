import os
import time
import logging

import requests


_token = None

INGESTIONS_SCOPE = "api://finance-app-api/ingestions:read"


def get_access_token():
    """
    Obtains (and caches) a client_credentials token from the auth authority
    for the Finance API / Notification Ingester.
    """
    global _token

    if _token is not None and _token["expires_at"] > time.time() + 60:
        return _token["access_token"]

    authority = os.environ["ATLAS_AUTH_AUTHORITY"].rstrip("/")
    resp = requests.post(
        f"{authority}/connect/token",
        data={
            "grant_type": "client_credentials",
            "client_id": os.environ["ATLAS_AUTH_AUDIENCE"],
            "client_secret": os.environ["ATLAS_AUTH_SECRET"],
            "scope": INGESTIONS_SCOPE,
        },
        timeout=30,
    )
    if not resp.ok:
        raise Exception(f"Auth token request failed: {resp.status_code} {resp.text}")
    payload = resp.json()

    _token = {
        "access_token": payload["access_token"],
        "expires_at": time.time() + int(payload.get("expires_in", 3600)),
    }
    logging.info("Finance API token acquired")
    return _token["access_token"]


def search_ingestions(amount, start_time=None, end_time=None):
    """
    Calls the Notification Ingester's GET /ingestions/search
    (amount + received_at range). Returns the list of ingestion records.
    """
    base_url = os.environ.get("INGESTER_BASE_URL", "http://localhost:7072").rstrip("/")

    params = {"amount": amount}
    if start_time is not None:
        params["startDate"] = start_time
    if end_time is not None:
        params["endDate"] = end_time

    for attempt in (1, 2):
        resp = requests.get(
            f"{base_url}/ingestions/search",
            params=params,
            headers={"Authorization": f"Bearer {get_access_token()}"},
            timeout=30,
        )
        if resp.status_code == 401 and attempt == 1:
            global _token
            _token = None
            continue
        if not resp.ok:
            raise Exception(f"Ingestion search failed: {resp.status_code} {resp.text}")
        return resp.json()

    raise Exception("Ingestion search failed after token refresh")
