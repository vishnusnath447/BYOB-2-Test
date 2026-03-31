"""
Payment Investigation AI Agent — Chat UI
Built with LangGraph + FAISS memory + MCP-style tools
"""

import uuid
import sys
import os
import streamlit as st
from langchain_core.messages import HumanMessage, AIMessage

# Path fix for running from app/ directory
sys.path.insert(0, os.path.dirname(__file__))

from agent.graph import run_agent, summarize_and_save_session
from memory.faiss_memory import get_all_sessions

# ── Page config ───────────────────────────────────────────────────────────────
st.set_page_config(page_title="Payment AI Agent", layout="wide", page_icon="💳")

# ── Session state init ────────────────────────────────────────────────────────
if "session_id" not in st.session_state:
    st.session_state.session_id = str(uuid.uuid4())[:8]

if "chat_history" not in st.session_state:
    st.session_state.chat_history = []  # LangChain message objects

if "display_messages" not in st.session_state:
    st.session_state.display_messages = []  # {"role", "content", "tools"}


# ── Sidebar ───────────────────────────────────────────────────────────────────
with st.sidebar:
    st.title("💳 Payment Agent")
    st.caption(f"Session: `{st.session_state.session_id}`")

    st.divider()

    if st.button("🗂️ Save & New Session", use_container_width=True):
        summarize_and_save_session(st.session_state.chat_history, st.session_state.session_id)
        st.session_state.session_id = str(uuid.uuid4())[:8]
        st.session_state.chat_history = []
        st.session_state.display_messages = []
        st.rerun()

    if st.button("🗑️ Clear Chat", use_container_width=True):
        st.session_state.chat_history = []
        st.session_state.display_messages = []
        st.rerun()

    st.divider()
    st.subheader("📚 Past Sessions")
    sessions = get_all_sessions()
    if sessions:
        for sid, data in list(sessions.items())[-5:]:  # show last 5
            with st.expander(f"Session {sid[:8]}"):
                st.caption(data.get("summary", "")[:300] + "...")
    else:
        st.caption("No past sessions yet.")

    st.divider()
    st.subheader("🛠️ Available Tools")
    st.caption("• `get_call_ref` — PTX → CallRef mapping")
    st.caption("• `analyze_logs` — Log error lookup")
    st.caption("• `check_transaction` — DB status check")
    st.caption("• `get_pod_status` — K8s health")

    st.divider()
    st.caption("Powered by LangGraph + FAISS + Groq")


# ── Main chat area ────────────────────────────────────────────────────────────
st.title("Payment Investigation Agent")
st.caption("Ask about payment tracking IDs, failures, or infrastructure. Follow-up questions are supported.")

# Render existing messages
for msg in st.session_state.display_messages:
    with st.chat_message(msg["role"]):
        st.markdown(msg["content"])
        if msg.get("tools"):
            st.caption(f"🛠️ Tools used: {' → '.join(msg['tools'])}")

# Chat input
if prompt := st.chat_input("Ask about a payment (e.g. 'What happened to PTX-1006?')"):

    # Show user message
    with st.chat_message("user"):
        st.markdown(prompt)
    st.session_state.display_messages.append({"role": "user", "content": prompt})

    # Run agent
    with st.chat_message("assistant"):
        with st.spinner("Investigating..."):
            result = run_agent(
                user_query=prompt,
                chat_history=st.session_state.chat_history,
                session_id=st.session_state.session_id,
            )

        answer = result["answer"]
        tools = result["tools_used"]

        st.markdown(answer)
        if tools:
            st.caption(f"🛠️ Tools used: {' → '.join(tools)}")

    # Update state
    st.session_state.chat_history = result["updated_history"]
    st.session_state.display_messages.append({
        "role": "assistant",
        "content": answer,
        "tools": tools,
    })