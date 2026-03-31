import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import ChatPanel from './components/ChatPanel';
import StatusBar from './components/StatusBar';

const API = '';

export default function App() {
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pastSessions, setPastSessions] = useState([]);
  const [agentStatus, setAgentStatus] = useState('idle'); // idle | thinking | calling-tool | done

  // Boot: create a session
  useEffect(() => {
    createSession();
    fetchPastSessions();
  }, []);

  const createSession = async () => {
    try {
      const res = await fetch(`${API}/session/new`, { method: 'POST' });
      const data = await res.json();
      setSessionId(data.session_id);
    } catch (e) {
      console.error('Failed to create session', e);
    }
  };

  const fetchPastSessions = async () => {
    try {
      const res = await fetch(`${API}/sessions`);
      const data = await res.json();
      setPastSessions(data);
    } catch (e) {}
  };

  const handleSend = useCallback(async (text) => {
    if (!text.trim() || loading || !sessionId) return;

    const userMsg = { role: 'user', content: text, id: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);
    setAgentStatus('thinking');

    try {
      const res = await fetch(`${API}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, message: text }),
      });
      const data = await res.json();

      const agentMsg = {
        role: 'agent',
        content: data.answer,
        tools: data.tools_used,
        id: Date.now() + 1,
      };
      setMessages(prev => [...prev, agentMsg]);
      setAgentStatus('done');
    } catch (e) {
      setMessages(prev => [...prev, {
        role: 'error',
        content: 'Connection failed. Make sure the backend is running.',
        id: Date.now() + 1,
      }]);
      setAgentStatus('idle');
    } finally {
      setLoading(false);
      setTimeout(() => setAgentStatus('idle'), 1500);
    }
  }, [loading, sessionId]);

  const handleNewSession = async () => {
    if (sessionId && messages.length > 0) {
      try {
        await fetch(`${API}/session/${sessionId}/save`, { method: 'POST' });
      } catch (e) {}
    }
    setMessages([]);
    setAgentStatus('idle');
    await createSession();
    await fetchPastSessions();
  };

  return (
    <div style={styles.root}>
      <Sidebar
        sessionId={sessionId}
        pastSessions={pastSessions}
        onNewSession={handleNewSession}
        messageCount={messages.length}
      />
      <div style={styles.main}>
        <ChatPanel
          messages={messages}
          loading={loading}
          agentStatus={agentStatus}
          onSend={handleSend}
          sessionId={sessionId}
        />
        <StatusBar agentStatus={agentStatus} sessionId={sessionId} messageCount={messages.length} />
      </div>
    </div>
  );
}

const styles = {
  root: {
    display: 'flex',
    height: '100vh',
    width: '100vw',
    overflow: 'hidden',
    background: 'var(--bg)',
  },
  main: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    position: 'relative',
  },
};
