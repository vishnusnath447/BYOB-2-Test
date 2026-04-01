import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import ChatPanel from './components/ChatPanel';

const API = '';

export default function App() {
  const [sessionId, setSessionId]     = useState(null);
  const [messages, setMessages]       = useState([]);
  const [loading, setLoading]         = useState(false);
  const [pastSessions, setPastSessions] = useState([]);
  const [agentStatus, setAgentStatus] = useState('idle');
  const [viewingPast, setViewingPast] = useState(false); // true when viewing a read-only past session

  useEffect(() => { createSession(); fetchPastSessions(); }, []);

  const createSession = async () => {
    try {
      const res  = await fetch(`${API}/session/new`, { method: 'POST' });
      const data = await res.json();
      setSessionId(data.session_id);
      setViewingPast(false);
    } catch (e) { console.error(e); }
  };

  const fetchPastSessions = async () => {
    try {
      const res  = await fetch(`${API}/sessions`);
      const data = await res.json();
      setPastSessions(data);
    } catch (e) {}
  };

  const handleSend = useCallback(async (text) => {
    if (!text.trim() || loading || !sessionId || viewingPast) return;

    const userMsg = { role: 'user', content: text, id: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);
    setAgentStatus('thinking');

    try {
      const res  = await fetch(`${API}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, message: text }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, {
        role: 'agent', content: data.answer, tools: data.tools_used, id: Date.now() + 1,
      }]);
      setAgentStatus('done');
    } catch (e) {
      setMessages(prev => [...prev, {
        role: 'error', content: 'Connection failed. Make sure the backend is running on port 8000.', id: Date.now() + 1,
      }]);
      setAgentStatus('idle');
    } finally {
      setLoading(false);
      setTimeout(() => setAgentStatus('idle'), 2000);
    }
  }, [loading, sessionId, viewingPast]);

  const handleNewSession = async () => {
    if (sessionId && messages.length > 0 && !viewingPast) {
      try { await fetch(`${API}/session/${sessionId}/save`, { method: 'POST' }); } catch (e) {}
    }
    setMessages([]);
    setAgentStatus('idle');
    await createSession();
    await fetchPastSessions();
  };

  // Load a past session into view (read-only)
  const handleLoadSession = (session) => {
    // Parse summary back into display messages for read-only view
    const lines = (session.summary || '').split('\n').filter(Boolean);
    const msgs = lines.map((line, i) => {
      if (line.startsWith('User: ')) {
        return { role: 'user', content: line.replace('User: ', ''), id: i };
      } else if (line.startsWith('Agent: ')) {
        return { role: 'agent', content: line.replace('Agent: ', ''), tools: [], id: i };
      }
      return null;
    }).filter(Boolean);

    setMessages(msgs);
    setSessionId(session.session_id);
    setViewingPast(true);
    setAgentStatus('idle');
  };

  return (
    <div style={s.root}>
      <Sidebar
        sessionId={sessionId}
        pastSessions={pastSessions}
        onNewSession={handleNewSession}
        onLoadSession={handleLoadSession}
        messageCount={messages.length}
        viewingPast={viewingPast}
        agentStatus={agentStatus}
      />
      <ChatPanel
        messages={messages}
        loading={loading}
        agentStatus={agentStatus}
        onSend={handleSend}
        sessionId={sessionId}
        viewingPast={viewingPast}
        onNewSession={handleNewSession}
      />
    </div>
  );
}

const s = {
  root: {
    display: 'flex',
    height: '100vh',
    width: '100vw',
    overflow: 'hidden',
    background: 'var(--bg)',
  },
};
