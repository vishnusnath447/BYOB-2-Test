"""
Payment Investigation AI Agent — LangGraph State Graph
Architecture: START → agent_node → tool_node (loop) → END
"""

from typing import Literal

from langchain_groq import ChatGroq
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from langgraph.graph import StateGraph, MessagesState, START, END
from langgraph.prebuilt import ToolNode

from mcp_tools.payment_tools import ALL_TOOLS
from memory.faiss_memory import retrieve_relevant_context, save_conversation_summary

BASE_SYSTEM_PROMPT = """You are a payment investigation AI agent for a Telecom company.
You have access to tools to investigate payment issues.
Use the tools as needed, then provide a clear and helpful response.

Guidelines:
- Logs and error details (service name, error message, status code, timestamp) SHOULD be shared in full when the user asks.
- Database records can be summarized for triage but do NOT expose raw SQL or internal DB schema.
- Infrastructure/pod status details SHOULD be shared when asked.
- When the user asks for "exact", "raw", or "detailed" info, provide all available fields.
- Present data in readable plain text — avoid dumping raw JSON.
- PTX IDs (PTX-XXXX) are payment tracking IDs. CR IDs (CR-XXXX) are call reference IDs.
"""


def build_llm():
    from config import GROQ_API_KEY
    llm = ChatGroq(api_key=GROQ_API_KEY, model="llama-3.3-70b-versatile")
    return llm.bind_tools(ALL_TOOLS)


def agent_node(state: MessagesState) -> dict:
    """Call the LLM with current message state."""
    llm_with_tools = build_llm()
    response = llm_with_tools.invoke(state["messages"])
    return {"messages": [response]}


def should_continue(state: MessagesState) -> Literal["tools", "__end__"]:
    """Route to tool execution or finish."""
    last = state["messages"][-1]
    if hasattr(last, "tool_calls") and last.tool_calls:
        return "tools"
    return "__end__"


def build_graph():
    tool_node = ToolNode(ALL_TOOLS)
    graph = StateGraph(MessagesState)
    graph.add_node("agent", agent_node)
    graph.add_node("tools", tool_node)
    graph.add_edge(START, "agent")
    graph.add_conditional_edges("agent", should_continue, {"tools": "tools", "__end__": END})
    graph.add_edge("tools", "agent")
    return graph.compile()


_graph = None

def get_graph():
    global _graph
    if _graph is None:
        _graph = build_graph()
    return _graph


def run_agent(user_query: str, chat_history: list, session_id: str) -> dict:
    """
    Run the agent with full chat history + FAISS context injection.
    Returns dict with 'answer', 'tools_used', and 'updated_history'.
    """
    graph = get_graph()

    # Inject relevant past session context if available
    past_context = retrieve_relevant_context(user_query)
    system_content = BASE_SYSTEM_PROMPT
    if past_context:
        system_content += f"\n\nRelevant context from past investigations:\n{past_context}"

    messages = [SystemMessage(content=system_content)] + chat_history + [HumanMessage(content=user_query)]

    result = graph.invoke({"messages": messages})

    final_message = result["messages"][-1]
    answer = final_message.content if hasattr(final_message, "content") else str(final_message)

    tools_used = []
    for msg in result["messages"]:
        if hasattr(msg, "tool_calls") and msg.tool_calls:
            tools_used.extend([tc["name"] for tc in msg.tool_calls])

    return {
        "answer": answer,
        "tools_used": tools_used,
        "updated_history": result["messages"][1:],  # strip system message
    }
