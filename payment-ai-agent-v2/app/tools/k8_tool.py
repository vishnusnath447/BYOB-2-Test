import json
from pathlib import Path


DATA_PATH = Path("data/k8_status.json")


def get_pod_status() -> dict:
    """
    Analyze mocked Kubernetes pod status.
    Returns summary of unhealthy and healthy services.
    """

    if not DATA_PATH.exists():
        return {"error": "k8_status.json not found"}

    with open(DATA_PATH, "r") as f:
        k8_data = json.load(f)

    healthy = []
    unhealthy = []

    for service_name, details in k8_data.items():
        if details.get("status") != "Running" or not details.get("ready", False):
            unhealthy.append({
                "service": service_name,
                "status": details.get("status"),
                "restartCount": details.get("restartCount"),
                "lastRestart": details.get("lastRestart")
            })
        else:
            healthy.append(service_name)

    return {
        "healthyServices": healthy,
        "unhealthyServices": unhealthy
    }