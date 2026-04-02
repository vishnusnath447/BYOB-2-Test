"""
Conversation memory using FAISS for semantic search over past sessions.
"""

import os
import json
from pathlib import Path
from typing import Optional
from langchain_core.documents import Document
from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEmbeddings

MEMORY_DIR = Path(__file__).parent.parent.parent / "data" / "memory"
MEMORY_DIR.mkdir(exist_ok=True)
FAISS_INDEX_PATH = MEMORY_DIR / "faiss_index"
SESSIONS_PATH    = MEMORY_DIR / "sessions.json"

# Cache the model in the data/memory dir so it never re-downloads
MODEL_CACHE_DIR  = str(MEMORY_DIR / "model_cache")

_embeddings = None


def get_embeddings():
    global _embeddings
    if _embeddings is None:
        _embeddings = HuggingFaceEmbeddings(
            model_name="all-MiniLM-L6-v2",
            model_kwargs={"device": "cpu"},
            encode_kwargs={"normalize_embeddings": True},
            cache_folder=MODEL_CACHE_DIR,   # ← persists model to disk
        )
    return _embeddings


def load_vector_store() -> Optional[FAISS]:
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

    sessions = {}
    if SESSIONS_PATH.exists():
        with open(SESSIONS_PATH) as f:
            sessions = json.load(f)
    sessions[session_id] = {"summary": summary, **(metadata or {})}
    with open(SESSIONS_PATH, "w") as f:
        json.dump(sessions, f, indent=2)


def retrieve_relevant_context(query: str, k: int = 3) -> str:
    store = load_vector_store()
    if not store:
        return ""
    try:
        docs = store.similarity_search(query, k=k)
        if not docs:
            return ""
        return "\n".join(f"[Past session]: {doc.page_content}" for doc in docs)
    except Exception:
        return ""


def get_all_sessions() -> dict:
    if SESSIONS_PATH.exists():
        with open(SESSIONS_PATH) as f:
            return json.load(f)
    return {}
