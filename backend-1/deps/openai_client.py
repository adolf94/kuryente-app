import os
import logging

from openai import OpenAI


_client = None


def get_client() -> OpenAI:
    """
    Returns a shared OpenAI-compatible client.

    Required config (Azure Function App settings / local.settings.json Values):
        AI_API_KEY : API key for the OpenAI-compatible service
        AI_BASE_URL: API base URL (e.g. https://openrouter.ai/api/v1)
    """
    global _client

    if _client is None:
        api_key = os.environ["AI_API_KEY"]
        base_url = os.environ.get("AI_BASE_URL", "https://openrouter.ai/api/v1")

        _client = OpenAI(
            api_key=api_key,
            base_url=base_url,
            default_headers={"HTTP-Referer": "https://kuryente.adolfrey.com", "X-Title": "Kuryente Tool"},
        )
        logging.info(f"AI client initialized: {base_url}")

    return _client


def get_model() -> str:
    return os.environ.get("AI_MODEL", "qwen/qwen3.8-flash")


def get_vision_model() -> str:
    """Model used for image/PDF extraction; must support file inputs."""
    return os.environ.get("AI_VISION_MODEL", "google/gemini-3.8-flash")
