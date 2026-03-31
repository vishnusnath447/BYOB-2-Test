"""
MCP-compatible tools for the payment investigation agent.
Using LangChain @tool decorators — no heavy JSON schema needed in the prompt.
LangGraph picks these up automatically.
"""

import json
import sqlite3
from pathlib import Path
from langchain_core.tools import tool

DATA_DIR = Path(__file__).parent.parent.parent / "data"


@tool
def get_call_ref(payment_tracking_id: str) -> dict:
    """
    Get the callRefId mapped to a paymentTrackingId from metadata.
    Always call this first when you have a PTX id and need to investigate logs.
    """
    metadata_path = DATA_DIR / "metadata.json"
    if not metadata_path.exists():
        return {"error": "metadata.json not found"}

    with open(metadata_path) as f:
        metadata = json.load(f)

    call_ref = metadata.get(payment_tracking_id)
    if not call_ref:
        return {"paymentTrackingId": payment_tracking_id, "found": False, "message": "No callRefId mapping found"}

    return {"paymentTrackingId": payment_tracking_id, "callRefId": call_ref, "found": True}


@tool
def analyze_logs(call_ref_id: str) -> dict:
    """
    Query logs for a given callRefId to find errors, failures, or success status.
    Use 'ALL' as call_ref_id to get all failed transactions.
    """
    logs_path = DATA_DIR / "logs.json"
    if not logs_path.exists():
        return {"error": "logs.json not found"}

    with open(logs_path) as f:
        logs = json.load(f)

    if call_ref_id == "ALL":
        failed = [log for log in logs if log["status"] != 200]
        failed_refs = list(set(log["callRefId"] for log in failed))
        return {"failed_call_refs": failed_refs, "count": len(failed_refs)}

    related = [log for log in logs if log["callRefId"] == call_ref_id]
    if not related:
        return {"callRefId": call_ref_id, "found": False, "message": "No logs found"}

    failures = [log for log in related if log["status"] != 200]
    if failures:
        f = failures[0]
        return {
            "callRefId": call_ref_id,
            "found": True,
            "status": "FAILED",
            "failedService": f["service"],
            "errorMessage": f["message"],
            "errorStatusCode": f["status"],
            "timestamp": f["timestamp"],
        }

    return {"callRefId": call_ref_id, "found": True, "status": "SUCCESS",
            "servicesChecked": [log["service"] for log in related]}


@tool
def check_transaction(payment_tracking_id: str) -> dict:
    """
    Check if a payment transaction exists in the database and get its status.
    """
    db_path = DATA_DIR / "payments.db"
    if not db_path.exists():
        return {"error": "payments.db not found"}

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute(
        "SELECT paymentTrackingId, callRefId, status, createdAt FROM payments WHERE paymentTrackingId = ?",
        (payment_tracking_id,)
    )
    row = cursor.fetchone()
    conn.close()

    if not row:
        return {"paymentTrackingId": payment_tracking_id, "existsInDB": False, "message": "Transaction not found"}

    return {"paymentTrackingId": row[0], "callRefId": row[1], "status": row[2], "createdAt": row[3], "existsInDB": True}


@tool
def get_pod_status() -> dict:
    """
    Check Kubernetes pod health and infrastructure status.
    Use when asked about infra, k8, pods, or to correlate failures with infrastructure issues.
    """
    k8_path = DATA_DIR / "k8_status.json"
    if not k8_path.exists():
        return {"error": "k8_status.json not found"}

    with open(k8_path) as f:
        k8_data = json.load(f)

    healthy, unhealthy = [], []
    for service, details in k8_data.items():
        if details.get("status") != "Running" or not details.get("ready", False):
            unhealthy.append({
                "service": service,
                "status": details.get("status"),
                "restartCount": details.get("restartCount"),
                "lastRestart": details.get("lastRestart"),
            })
        else:
            healthy.append(service)

    return {"healthyServices": healthy, "unhealthyServices": unhealthy}


# All tools exported for LangGraph binding
ALL_TOOLS = [get_call_ref, analyze_logs, check_transaction, get_pod_status]
