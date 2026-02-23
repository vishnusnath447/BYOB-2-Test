from tools.metadata_tool import get_call_ref
from tools.logs_tool import analyze_logs
from tools.db_tool import check_transaction
from tools.k8_tool import get_pod_status
from agent.llm_planner import create_plan
import json
from pathlib import Path

def extract_failed_transactions():
    DATA_PATH = Path("data/logs.json")

    if not DATA_PATH.exists():
        return ["logs.json not found"]

    with open(DATA_PATH, "r") as f:
        logs = json.load(f)

    failed = [log for log in logs if log["status"] != 200]

    return list(set([log["callRefId"] for log in failed]))

def generate_infra_summary(k8_status: dict) -> str:

    unhealthy = k8_status.get("unhealthyServices", [])

    if not unhealthy:
        return "All services are healthy."

    summary = "Infrastructure issues detected:\n"

    for svc in unhealthy:
        summary += f"- {svc['service']} is {svc['status']} (restarts: {svc['restartCount']})\n"

    return summary

def extract_payment_id(user_query: str) -> str | None:
    """
    Extract PTX-xxxx from user query.
    """
    words = user_query.split()
    for word in words:
        if word.startswith("PTX-"):
            return word.strip()
    return None


def generate_summary(payment_id: str, logs: dict, db_status: dict, k8_status: dict) -> str:
    """
    Generate human-readable investigation summary.
    """

    lines = []
    lines.append(f"Transaction: {payment_id}")

    # --- LOG STATUS ---
    if logs.get("found"):
        if logs.get("status") == "SUCCESS":
            lines.append("Status: SUCCESS")
        elif logs.get("status") == "FAILED":
            lines.append("Status: FAILED")
            lines.append(
                f"Failure occurred in {logs.get('failedService')} "
                f"with error {logs.get('errorStatusCode')} "
                f"({logs.get('errorMessage')})."
            )
    else:
        lines.append("No logs found for this transaction.")

    # --- DATABASE STATUS ---
    if db_status.get("existsInDB"):
        lines.append("Database: Transaction persisted successfully.")
    else:
        lines.append("Database: Transaction not found (not persisted).")

    # --- K8 STATUS CORRELATION ---
    unhealthy = k8_status.get("unhealthyServices", [])

    if unhealthy:
        lines.append("Infrastructure issues detected:")
        for svc in unhealthy:
            lines.append(
                f"- {svc.get('service')} is {svc.get('status')} "
                f"(restarts: {svc.get('restartCount')})"
            )

        # Correlate failure service with unhealthy pod
        if logs.get("status") == "FAILED":
            failed_service = logs.get("failedService")
            for svc in unhealthy:
                if svc.get("service") == failed_service:
                    lines.append(
                        f"Likely root cause: {failed_service} instability "
                        f"(pod not healthy)."
                    )
                    break

    return "\n".join(lines)


def run_agent(user_query: str) -> dict:

    plan = create_plan(user_query)

    payment_id = extract_payment_id(user_query)

    if plan["requires_payment_id"] and not payment_id:
        return {"error": "PaymentTrackingId required but not found in query."}

    logs = None
    db_status = None
    k8_status = None
    call_ref = None

    # --- Execute Steps Based on Plan ---

    if "metadata" in plan["steps"]:
        metadata = get_call_ref(payment_id)
        if not metadata.get("found"):
            return metadata
        call_ref = metadata["callRefId"]

    if "logs" in plan["steps"]:
        if not call_ref and payment_id:
            metadata = get_call_ref(payment_id)
            if metadata.get("found"):
                call_ref = metadata["callRefId"]
        if call_ref:
            logs = analyze_logs(call_ref)

    if "db" in plan["steps"]:
        db_status = check_transaction(payment_id)

    if "k8" in plan["steps"]:
        k8_status = get_pod_status()

    # --- Generate Summary ---
    # --- Special Intent Handling ---

    if plan["intent"] == "LIST_FAILED":
        failed_list = extract_failed_transactions()
        return {
            "intent": plan["intent"],
            "summary": "Failed Transactions:\n" + "\n".join(failed_list),
            "details": {"failedTransactions": failed_list}
        }

    if plan["intent"] == "CHECK_INFRA":
        k8_status = get_pod_status()
        summary = generate_infra_summary(k8_status)
        return {
            "intent": plan["intent"],
            "summary": summary,
            "details": {"k8_status": k8_status}
        }

    summary = generate_summary(
        payment_id,
        logs or {},
        db_status or {},
        k8_status or {}
    )

    return {
        "intent": plan["intent"],
        "summary": summary,
        "details": {
            "paymentTrackingId": payment_id,
            "callRefId": call_ref,
            "logs": logs,
            "database": db_status,
            "k8_status": k8_status
        }
    }