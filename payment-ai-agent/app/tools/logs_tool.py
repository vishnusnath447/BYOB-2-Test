import json
from pathlib import Path


DATA_PATH = Path("data/logs.json")


def analyze_logs(call_ref_id: str) -> dict:
    """
    Analyze logs for a given callRefId.
    Returns summarized investigation data.
    """

    if not DATA_PATH.exists():
        return {"error": "logs.json not found"}

    with open(DATA_PATH, "r") as f:
        logs = json.load(f)

    related_logs = [log for log in logs if log["callRefId"] == call_ref_id]

    if not related_logs:
        return {
            "callRefId": call_ref_id,
            "found": False,
            "message": "No logs found"
        }

    failure_logs = [log for log in related_logs if log["status"] != 200]

    if failure_logs:
        failure = failure_logs[0]
        return {
            "callRefId": call_ref_id,
            "found": True,
            "status": "FAILED",
            "failedService": failure["service"],
            "errorMessage": failure["message"],
            "errorStatusCode": failure["status"],
            "timestamp": failure["timestamp"]
        }

    return {
        "callRefId": call_ref_id,
        "found": True,
        "status": "SUCCESS",
        "servicesChecked": [log["service"] for log in related_logs]
    }