"""
Conversation memory using FAISS for semantic search over past sessions.
Summaries of past conversations are embedded and stored so the agent
can retrieve relevant context for follow-up questions.
"""

import os
import json
import pickle
from pathlib import Path
from typing import Optional
from langchain_core.documents import Document
from langchain_community.vectorstores import FAISS
from langchain_community.embeddings import HuggingFaceEmbeddings

MEMORY_DIR = Path(__file__).parent.parent.parent / "data" / "memory"
MEMORY_DIR.mkdir(exist_ok=True)
FAISS_INDEX_PATH = MEMORY_DIR / "faiss_index"
SESSIONS_PATH = MEMORY_DIR / "sessions.json"

# Lightweight local embeddings — no API key needed
_embeddings = None


def get_embeddings():
    global _embeddings
    if _embeddings is None:
        _embeddings = HuggingFaceEmbeddings(
            model_name="all-MiniLM-L6-v2",
            model_kwargs={"device": "cpu"},
            encode_kwargs={"normalize_embeddings": True},
        )
    return _embeddings


def load_vector_store() -> Optional[FAISS]:
    """Load existing FAISS index if it exists."""
    if FAISS_INDEX_PATH.exists():
        try:
            return FAISS.load_local(
                str(FAISS_INDEX_PATH),
                get_embeddings(),
                allow_dangerous_deserialization=True,
            )
        except Exception:
            pass
    return None


def save_conversation_summary(session_id: str, summary: str, metadata: dict = None):
    """
    Embed and store a conversation summary in FAISS.
    Called at end of each session to persist context for future follow-ups.
    """
    doc = Document(
        page_content=summary,
        metadata={"session_id": session_id, **(metadata or {})}
    )

    store = load_vector_store()
    if store:
        store.add_documents([doc])
    else:
        store = FAISS.from_documents([doc], get_embeddings())

    store.save_local(str(FAISS_INDEX_PATH))

    # Also save raw sessions JSON for display
    sessions = {}
    if SESSIONS_PATH.exists():
        with open(SESSIONS_PATH) as f:
            sessions = json.load(f)
    sessions[session_id] = {"summary": summary, **(metadata or {})}
    with open(SESSIONS_PATH, "w") as f:
        json.dump(sessions, f, indent=2)


def retrieve_relevant_context(query: str, k: int = 3) -> str:
    """
    Retrieve top-k most relevant past conversation summaries for a query.
    Returns a formatted string to inject into the agent's context.
    """
    store = load_vector_store()
    if not store:
        return ""

    try:
        docs = store.similarity_search(query, k=k)
        if not docs:
            return ""
        context_parts = [f"[Past session]: {doc.page_content}" for doc in docs]
        return "\n".join(context_parts)
    except Exception:
        return ""


def get_all_sessions() -> dict:
    """Return all saved sessions for display in UI."""
    if SESSIONS_PATH.exists():
        with open(SESSIONS_PATH) as f:
            return json.load(f)
    return {}
