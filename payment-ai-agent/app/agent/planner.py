def create_plan(user_query: str) -> dict:
    """
    Creates an investigation plan based on user query.
    This is rule-based for now but LLM-replaceable.
    """

    query = user_query.lower()

    plan = {
        "intent": None,
        "requires_payment_id": False,
        "steps": []
    }

    # Detect intent
    if "status" in query:
        plan["intent"] = "CHECK_STATUS"
        plan["requires_payment_id"] = True
        plan["steps"] = ["db"]

    elif "fail" in query or "why" in query or "happened" in query:
        plan["intent"] = "INVESTIGATE_FAILURE"
        plan["requires_payment_id"] = True
        plan["steps"] = ["metadata", "logs", "db", "k8"]

    elif "failed transactions" in query or "show failed" in query:
        plan["intent"] = "LIST_FAILED"
        plan["requires_payment_id"] = False
        plan["steps"] = ["logs"]

    elif "health" in query or "k8" in query:
        plan["intent"] = "CHECK_INFRA"
        plan["requires_payment_id"] = False
        plan["steps"] = ["k8"]

    else:
        # default full investigation
        plan["intent"] = "FULL_INVESTIGATION"
        plan["requires_payment_id"] = True
        plan["steps"] = ["metadata", "logs", "db", "k8"]

    return plan