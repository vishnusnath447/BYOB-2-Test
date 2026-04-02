"""
Payment Investigation AI Agent v3
FastAPI backend
"""

import uuid
import sys
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional

sys.path.insert(0, os.path.dirname(__file__))

from agent.graph import run_agent
from memory.faiss_memory import get_all_sessions, save_conversation_summary
from langchain_core.messages import HumanMessage, AIMessage

app = FastAPI(title="Payment AI Agent v3")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory store
# sessions[sid] = { "history": [...LangChain messages], "log": ["User: ...", "Agent: ..."] }
sessions: dict = {}


class ChatRequest(BaseModel):
    session_id: str
    message: str


class NewSessionResponse(BaseModel):
    session_id: str


class ChatResponse(BaseModel):
    answer: str
    tools_used: List[str]
    session_id: str


class SessionSummary(BaseModel):
    session_id: str
    summary: str
    query_count: Optional[int] = 0


@app.post("/session/new", response_model=NewSessionResponse)
def new_session():
    sid = str(uuid.uuid4())[:8]
    sessions[sid] = {"history": [], "log": []}
    return {"session_id": sid}


@app.post("/session/{session_id}/save")
def save_session(session_id: str):
    session = sessions.get(session_id, {})
    log = session.get("log", [])

    if log:
        summary = "\n".join(log)
        save_conversation_summary(
            session_id=session_id,
            summary=summary,
            metadata={"query_count": len([l for l in log if l.startswith("User:")])}
        )

    sessions.pop(session_id, None)
    return {"status": "saved", "session_id": session_id}


@app.post("/chat", response_model=ChatResponse)
def chat(req: ChatRequest):
    sid = req.session_id
    if sid not in sessions:
        sessions[sid] = {"history": [], "log": []}

    session = sessions[sid]
    history = session["history"]

    result = run_agent(
        user_query=req.message,
        chat_history=history,
        session_id=sid,
    )

    # Update LangChain history
    sessions[sid]["history"] = result["updated_history"]

    # Update plain-text log (this is what gets saved to FAISS)
    sessions[sid]["log"].append(f"User: {req.message}")
    sessions[sid]["log"].append(f"Agent: {result['answer']}")

    return {
        "answer": result["answer"],
        "tools_used": result["tools_used"],
        "session_id": sid,
    }


@app.get("/sessions", response_model=List[SessionSummary])
def list_sessions():
    all_sessions = get_all_sessions()
    return [
        {
            "session_id": sid,
            "summary": data.get("summary", "")[:300],
            "query_count": data.get("query_count", 0),
        }
        for sid, data in list(all_sessions.items())[-10:]
    ]


@app.get("/health")
def health():
    return {"status": "ok", "version": "v3"}
