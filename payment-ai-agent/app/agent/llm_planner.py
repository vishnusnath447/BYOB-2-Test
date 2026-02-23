import json
from groq import Groq
from config import GROQ_API_KEY

client = Groq(api_key=GROQ_API_KEY)

MODEL = "llama-3.3-70b-versatile"

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
    response = client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_query}
        ],
        response_format={"type": "json_object"}
    )

    try:
        return json.loads(response.choices[0].message.content)
    except json.JSONDecodeError:
        return {
            "intent": "FULL_INVESTIGATION",
            "requires_payment_id": True,
            "steps": ["metadata", "logs", "db", "k8"]
        }