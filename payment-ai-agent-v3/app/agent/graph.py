"""
LangGraph-based payment investigation agent.
Replaces the manual while-loop executor with a proper state graph.

Graph structure:
  START → agent_node → (tool_node if tool calls, else END)
               ↑______________|

The agent automatically:
- Calls MCP tools as needed
- Maintains full chat history (MessagesState)
- Retrieves relevant past session context via FAISS
- Summarizes the conversation at the end for future sessions
"""

import os
import uuid
from typing import Literal

from langchain_groq import ChatGroq
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from langgraph.graph import StateGraph, MessagesState, START, END
from langgraph.prebuilt import ToolNode

from mcp_tools.payment_tools import ALL_TOOLS
from memory.faiss_memory import retrieve_relevant_context, save_conversation_summary

# ── LLM setup ────────────────────────────────────────────────────────────────
# Lean system prompt — tools self-describe via @tool docstrings (MCP style)
# No need for heavy JSON schema blocks in the prompt anymore.
BASE_SYSTEM_PROMPT = """You are a payment investigation AI agent.
You have access to tools to investigate payment issues.
Use the tools as needed, then provide a clear and helpful response.

Guidelines:
- Logs and error details (service name, error message, status code, timestamp) SHOULD be shared in full when the user asks — this is useful triage information.
- Database records (paymentTrackingId, callRefId, status, createdAt) can be summarized for triage but do NOT expose raw SQL or internal DB schema.
- Infrastructure/pod status details SHOULD be shared when asked.
- When the user asks for "exact", "raw", or "detailed" log info, provide all available fields: callRefId, service, errorMessage, status code, and timestamp.
- Only avoid dumping raw JSON structure — present data in readable plain text instead.
"""

def build_llm():
    from config import GROQ_API_KEY
    llm = ChatGroq(api_key=GROQ_API_KEY, model="llama-3.3-70b-versatile")
    return llm.bind_tools(ALL_TOOLS)


# ── Graph nodes ───────────────────────────────────────────────────────────────

def agent_node(state: MessagesState) -> dict:
    """Call the LLM with current message state."""
    llm_with_tools = build_llm()
    response = llm_with_tools.invoke(state["messages"])
    return {"messages": [response]}


def should_continue(state: MessagesState) -> Literal["tools", END]:
    """Route to tool execution or finish."""
    last = state["messages"][-1]
    if hasattr(last, "tool_calls") and last.tool_calls:
        return "tools"
    return END


# ── Build graph ───────────────────────────────────────────────────────────────

def build_graph():
    tool_node = ToolNode(ALL_TOOLS)

    graph = StateGraph(MessagesState)
    graph.add_node("agent", agent_node)
    graph.add_node("tools", tool_node)

    graph.add_edge(START, "agent")
    graph.add_conditional_edges("agent", should_continue, {"tools": "tools", END: END})
    graph.add_edge("tools", "agent")  # loop back after tool execution

    return graph.compile()


_graph = None

def get_graph():
    global _graph
    if _graph is None:
        _graph = build_graph()
    return _graph


# ── Public interface ──────────────────────────────────────────────────────────

def run_agent(user_query: str, chat_history: list, session_id: str) -> dict:
    """
    Run the agent with full chat history + FAISS context injection.

    Args:
        user_query:   The current user message
        chat_history: List of LangChain message objects for this session
        session_id:   Unique ID for this session (for memory storage)

    Returns:
        dict with 'answer', 'tools_used', and updated 'messages'
    """
    graph = get_graph()

    # Retrieve relevant past sessions from FAISS
    past_context = retrieve_relevant_context(user_query)

    # Build system message — inject past context if available
    system_content = BASE_SYSTEM_PROMPT
    if past_context:
        system_content += f"\n\nRelevant context from past investigations:\n{past_context}"

    # Assemble messages: system + history + new user message
    messages = [SystemMessage(content=system_content)] + chat_history + [HumanMessage(content=user_query)]

    # Run the graph
    result = graph.invoke({"messages": messages})

    # Extract final answer and tools used
    final_message = result["messages"][-1]
    answer = final_message.content if hasattr(final_message, "content") else str(final_message)

    tools_used = []
    for msg in result["messages"]:
        if hasattr(msg, "tool_calls") and msg.tool_calls:
            tools_used.extend([tc["name"] for tc in msg.tool_calls])

    # Return updated message history (excluding system message, for UI storage)
    updated_history = result["messages"][1:]  # strip system msg

    return {
        "answer": answer,
        "tools_used": tools_used,
        "updated_history": updated_history,
    }


def summarize_and_save_session(chat_history: list, session_id: str):
    """
    At end of session, create a summary and store it in FAISS
    so future sessions can retrieve relevant context.
    """
    if not chat_history:
        return

    # Build a simple text summary from the conversation
    lines = []
    for msg in chat_history:
        if isinstance(msg, HumanMessage):
            lines.append(f"User: {msg.content}")
        elif isinstance(msg, AIMessage) and msg.content:
            lines.append(f"Agent: {msg.content}")

    summary = "\n".join(lines[-10:])  # last 10 exchanges
    save_conversation_summary(session_id, summary, metadata={"query_count": len(lines)})
