import requests
import json


OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL = "llama3"


SYSTEM_PROMPT = """
You are an investigation planning AI.

Return ONLY valid JSON.

Available intents:
- CHECK_STATUS
- INVESTIGATE_FAILURE
- LIST_FAILED
- CHECK_INFRA
- FULL_INVESTIGATION

Available steps:
- metadata
- logs
- db
- k8

Rules:
- If user asks status → CHECK_STATUS → ["db"]
- If asking why failed → INVESTIGATE_FAILURE → ["metadata","logs","db","k8"]
- If asking list failed → LIST_FAILED → ["logs"]
- If asking infra health → CHECK_INFRA → ["k8"]
- Otherwise → FULL_INVESTIGATION → ["metadata","logs","db","k8"]

Return format:
{
  "intent": "...",
  "requires_payment_id": true/false,
  "steps": [...]
}
"""


def create_plan(user_query: str) -> dict:
    prompt = SYSTEM_PROMPT + f"\nUser Query: {user_query}"

    response = requests.post(
        OLLAMA_URL,
        json={
            "model": MODEL,
            "prompt": prompt,
            "stream": False
        }
    )

    result = response.json()
    raw_output = result["response"]

    try:
        plan = json.loads(raw_output)
        return plan
    except json.JSONDecodeError:
        # fallback safe default
        return {
            "intent": "FULL_INVESTIGATION",
            "requires_payment_id": True,
            "steps": ["metadata", "logs", "db", "k8"]
        }