# Payment Investigation AI Agent — Final

**UST Neural Nexus | GenAI Hackathon 2025**

An autonomous payment failure investigation agent built with LangGraph, FAISS, and Groq.

## Architecture

```
React Frontend → FastAPI Backend → LangGraph Agent → 4 MCP Tools → Data Sources
                                         ↕
                                   FAISS Memory
```

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Inter + JetBrains Mono |
| Backend | FastAPI + Uvicorn |
| Agent | LangGraph state graph |
| LLM | Groq — Llama 3.3 70B Versatile |
| Memory | FAISS + sentence-transformers (all-MiniLM-L6-v2) |
| Data | SQLite · JSON files |

## Project Structure

```
payment-final/
├── app/
│   ├── server.py              ← FastAPI REST API
│   ├── config.py              ← API keys from .env
│   ├── agent/
│   │   └── graph.py           ← LangGraph agent (core logic)
│   ├── mcp_tools/
│   │   └── payment_tools.py   ← 4 MCP-style tools
│   └── memory/
│       └── faiss_memory.py    ← FAISS session memory
├── data/
│   ├── metadata.json          ← PTX → CallRef mappings
│   ├── logs.json              ← Service logs (mock)
│   ├── payments.db            ← SQLite transactions (mock)
│   └── k8_status.json         ← K8s pod status (mock)
├── frontend/
│   └── src/
│       ├── App.js
│       └── components/
│           ├── ChatPanel.js
│           └── Sidebar.js
└── requirements.txt
```

## Running Locally

### Backend
```bash
cd app
pip install -r ../requirements.txt
echo "GROQ_API_KEY=your_key" > .env
uvicorn server:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm start        # http://localhost:3000
```

## Tools

| Tool | Input | Data Source |
|---|---|---|
| `get_call_ref` | PTX-XXXX | metadata.json |
| `analyze_logs` | CR-XXXX | logs.json |
| `check_transaction` | PTX-XXXX | payments.db |
| `get_pod_status` | none | k8_status.json |

## API Endpoints

| Method | Path | Description |
|---|---|---|
| POST | `/session/new` | Create new session |
| POST | `/chat` | Send message, get answer |
| POST | `/session/{id}/save` | Save session to FAISS memory |
| GET | `/sessions` | List past sessions |
| GET | `/health` | Health check |
| GET | `/docs` | Swagger UI |
