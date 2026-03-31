# Payment Investigation AI Agent — v3

A full-stack React + FastAPI rewrite of v2. Drops Streamlit in favour of a custom dark-mode fintech UI.

## Stack

| Layer     | Technology                          |
|-----------|-------------------------------------|
| Frontend  | React 18, Space Mono + Syne fonts   |
| Backend   | FastAPI + Uvicorn                   |
| Agent     | LangGraph state graph               |
| LLM       | Groq — Llama 3.3 70B Versatile      |
| Memory    | FAISS + sentence-transformers (local)|
| Data      | SQLite · JSON files                 |

## Project Structure

```
payment-ai-agent-v3/
├── app/
│   ├── server.py           ← FastAPI backend (replaces ui.py)
│   ├── agent/graph.py      ← LangGraph agent (unchanged from v2)
│   ├── mcp_tools/          ← Tool definitions
│   ├── memory/             ← FAISS memory
│   └── services/           ← DB helpers
├── frontend/
│   ├── src/
│   │   ├── App.js
│   │   ├── components/
│   │   │   ├── Sidebar.js
│   │   │   ├── ChatPanel.js
│   │   │   └── StatusBar.js
│   │   └── index.css
│   └── package.json
├── data/                   ← Mock data (unchanged from v2)
└── requirements.txt
```

## Running Locally

### 1. Backend
```bash
cd app
pip install -r ../requirements.txt
cp ../.env.example .env   # add GROQ_API_KEY
uvicorn server:app --reload --port 8000
```

### 2. Frontend
```bash
cd frontend
npm install
npm start            # opens http://localhost:3000
```

The React dev server proxies `/chat`, `/session/*`, `/sessions` to `localhost:8000`.

## What Changed from v2

- **Streamlit removed** — replaced with React 18 SPA
- **FastAPI server** — clean REST API with session management
- **Session persistence** — save & start new sessions from the UI
- **Suggestion chips** — quick-start prompts on empty state
- **Live status bar** — agent state, message count, stack info
- **Tool call badges** — see exactly which tools fired per response
