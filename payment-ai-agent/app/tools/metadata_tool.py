import json
from pathlib import Path


DATA_PATH = Path("data/metadata.json")


def get_call_ref(payment_tracking_id: str) -> dict:
    """
    Fetch callRefId for a given paymentTrackingId.
    """

    if not DATA_PATH.exists():
        return {"error": "metadata.json not found"}

    with open(DATA_PATH, "r") as f:
        metadata = json.load(f)

    call_ref = metadata.get(payment_tracking_id)

    if not call_ref:
        return {
            "paymentTrackingId": payment_tracking_id,
            "found": False,
            "message": "No callRefId mapping found"
        }

    return {
        "paymentTrackingId": payment_tracking_id,
        "callRefId": call_ref,
        "found": True
    }