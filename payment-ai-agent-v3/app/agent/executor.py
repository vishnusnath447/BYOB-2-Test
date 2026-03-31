# app/agent/executor.py
import json
from pathlib import Path
from groq import Groq
from config import GROQ_API_KEY

from tools.metadata_tool import get_call_ref
from tools.logs_tool import analyze_logs
from tools.db_tool import check_transaction
from tools.k8_tool import get_pod_status

client = Groq(api_key=GROQ_API_KEY)
MODEL = "llama-3.3-70b-versatile"

# ----------------------------
# Tool Definitions for LLM
# ----------------------------
TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "get_call_ref",
            "description": "Get the callRefId mapped to a paymentTrackingId from metadata. Always call this first when you have a PTX id and need to investigate logs.",
            "parameters": {
                "type": "object",
                "properties": {
                    "payment_tracking_id": {
                        "type": "string",
                        "description": "The PTX-xxxx payment tracking ID"
                    }
                },
                "required": ["payment_tracking_id"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "analyze_logs",
            "description": "Query logs for a given callRefId to find errors, failures, or success status. Use 'ALL' as call_ref_id to get all failed transactions.",
            "parameters": {
                "type": "object",
                "properties": {
                    "call_ref_id": {
                        "type": "string",
                        "description": "The callRefId to query logs for. Use 'ALL' to list all failed transactions."
                    }
                },
                "required": ["call_ref_id"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "check_transaction",
            "description": "Check if a payment transaction exists in the database and get its status.",
            "parameters": {
                "type": "object",
                "properties": {
                    "payment_tracking_id": {
                        "type": "string",
                        "description": "The PTX-xxxx payment tracking ID"
                    }
                },
                "required": ["payment_tracking_id"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_pod_status",
            "description": "Check Kubernetes pod health and infrastructure status. Use when asked about infra, k8, pods, or to correlate failures with infrastructure issues.",
            "parameters": {
                "type": "object",
                "properties": {}
            }
        }
    }
]

SYSTEM_PROMPT = """
You are a payment investigation AI agent.
You have access to tools to investigate payment issues.
Use the tools as needed to answer the user's question.
After gathering all necessary information, provide a clear and concise natural language summary.
Do not show raw JSON or technical field names in your final answer.
"""


# ----------------------------
# Tool Dispatcher
# ----------------------------
def dispatch_tool(tool_name: str, tool_args: dict) -> str:
    """Execute the requested tool and return result as string."""

    if tool_name == "get_call_ref":
        result = get_call_ref(tool_args["payment_tracking_id"])

    elif tool_name == "analyze_logs":
        call_ref_id = tool_args["call_ref_id"]
        if call_ref_id == "ALL":
            # Read all logs and return failed ones
            DATA_PATH = Path("data/logs.json")
            with open(DATA_PATH, "r") as f:
                logs = json.load(f)
            failed = [log for log in logs if log["status"] != 200]
            failed_refs = list(set([log["callRefId"] for log in failed]))
            result = {"failed_call_refs": failed_refs, "count": len(failed_refs)}
        else:
            result = analyze_logs(call_ref_id)

    elif tool_name == "check_transaction":
        result = check_transaction(tool_args["payment_tracking_id"])

    elif tool_name == "get_pod_status":
        result = get_pod_status()

    else:
        result = {"error": f"Unknown tool: {tool_name}"}

    return json.dumps(result)


# ----------------------------
# Main Agent Function
# ----------------------------
def run_agent(user_query: str) -> dict:
    """Main agent loop using Groq tool calling."""

    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": user_query}
    ]

    tools_used = []

    # Agentic loop — keep calling LLM until it stops requesting tools
    while True:
        response = client.chat.completions.create(
        model=MODEL,
        messages=messages,
        tools=TOOLS,
        tool_choice="auto",
        parallel_tool_calls=False
    )

        message = response.choices[0].message

        # If no tool calls → LLM is done, return final answer
        if not message.tool_calls:
            return {
                "summary": message.content.strip(),
                "tools_used": tools_used
            }

        # Append assistant message with tool calls
        messages.append({
            "role": "assistant",
            "content": message.content or "",
            "tool_calls": [
                {
                    "id": tc.id,
                    "type": "function",
                    "function": {
                        "name": tc.function.name,
                        "arguments": tc.function.arguments
                    }
                }
                for tc in message.tool_calls
            ]
        })

        # Execute each tool and append results
        for tool_call in message.tool_calls:
            tool_name = tool_call.function.name
            tool_args = json.loads(tool_call.function.arguments)

            tools_used.append(tool_name)
            tool_result = dispatch_tool(tool_name, tool_args)

            messages.append({
                "role": "tool",
                "tool_call_id": tool_call.id,
                "content": tool_result
            })