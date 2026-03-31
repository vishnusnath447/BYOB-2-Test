import React, { useRef, useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';

const TOOL_ICONS = {
  get_call_ref:      { icon: '🔗', label: 'get_call_ref',      color: '#00d4ff' },
  analyze_logs:      { icon: '📋', label: 'analyze_logs',      color: '#ffb300' },
  check_transaction: { icon: '🗄',  label: 'check_transaction', color: '#00ff94' },
  get_pod_status:    { icon: '🖥',  label: 'get_pod_status',    color: '#ff6b9d' },
};

const SUGGESTIONS = [
  'What happened to PTX-1006?',
  'Show me all failed transactions',
  'Check the infrastructure status',
  'Investigate PTX-1003',
];

function ToolBadge({ toolName }) {
  const info = TOOL_ICONS[toolName] || { icon: '🔧', label: toolName, color: '#5a7a99' };
  return (
    <span style={{ ...ts.badge, borderColor: info.color + '44', color: info.color }}>
      {info.icon} {info.label}
    </span>
  );
}

function TypingIndicator() {
  return (
    <div style={ts.typingWrap}>
      <div style={ts.agentAvatar}>AI</div>
      <div style={ts.typingBubble}>
        {[0, 1, 2].map(i => (
          <span key={i} style={{ ...ts.typingDot, animationDelay: `${i * 0.15}s` }} />
        ))}
      </div>
    </div>
  );
}

function Message({ msg }) {
  const isUser = msg.role === 'user';
  const isError = msg.role === 'error';

  return (
    <div style={{ ...ts.msgRow, justifyContent: isUser ? 'flex-end' : 'flex-start', animation: 'fadeUp 0.3s ease' }}>
      {!isUser && (
        <div style={{ ...ts.agentAvatar, alignSelf: 'flex-end', flexShrink: 0 }}>AI</div>
      )}
      <div style={{ maxWidth: '72%' }}>
        {/* Tool badges */}
        {msg.tools && msg.tools.length > 0 && (
          <div style={ts.toolsRow}>
            <span style={ts.toolsLabel}>Tools called →</span>
            {msg.tools.map((t, i) => <ToolBadge key={i} toolName={t} />)}
          </div>
        )}
        <div style={{
          ...ts.bubble,
          ...(isUser ? ts.userBubble : isError ? ts.errorBubble : ts.agentBubble),
        }}>
          {isUser ? (
            <span style={ts.userText}>{msg.content}</span>
          ) : (
            <div style={ts.markdownWrap}>
              <ReactMarkdown>{msg.content}</ReactMarkdown>
            </div>
          )}
        </div>
      </div>
      {isUser && (
        <div style={{ ...ts.userAvatar, alignSelf: 'flex-end', flexShrink: 0 }}>You</div>
      )}
    </div>
  );
}

function EmptyState({ onSuggest }) {
  return (
    <div style={ts.empty}>
      <div style={ts.emptyIcon}>⬡</div>
      <div style={ts.emptyTitle}>Payment Investigation Agent</div>
      <div style={ts.emptySub}>
        Ask about any payment tracking ID, failure root cause,<br />
        or infrastructure status. The agent investigates autonomously.
      </div>
      <div style={ts.suggestions}>
        {SUGGESTIONS.map(s => (
          <button key={s} style={ts.suggestBtn} onClick={() => onSuggest(s)}>
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function ChatPanel({ messages, loading, agentStatus, onSend, sessionId }) {
  const [input, setInput] = useState('');
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const send = () => {
    if (!input.trim()) return;
    onSend(input.trim());
    setInput('');
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  return (
    <div style={ts.panel}>
      {/* Header */}
      <div style={ts.header}>
        <div style={ts.headerLeft}>
          <div style={ts.headerTitle}>Investigation Console</div>
          {sessionId && (
            <span style={ts.headerSession}>
              <span style={ts.liveIndicator} />
              {`SID-${sessionId}`}
            </span>
          )}
        </div>
        <div style={ts.headerRight}>
          {agentStatus === 'thinking' && <span style={ts.statusChip}>🧠 Reasoning...</span>}
          {agentStatus === 'calling-tool' && <span style={ts.statusChip}>🔧 Calling tool...</span>}
          {agentStatus === 'done' && <span style={{ ...ts.statusChip, color: 'var(--green)' }}>✓ Complete</span>}
        </div>
      </div>

      {/* Messages */}
      <div style={ts.messages}>
        {messages.length === 0 ? (
          <EmptyState onSuggest={(s) => { setInput(s); inputRef.current?.focus(); }} />
        ) : (
          <>
            {messages.map(m => <Message key={m.id} msg={m} />)}
            {loading && <TypingIndicator />}
            <div ref={bottomRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div style={ts.inputArea}>
        <div style={ts.inputWrap}>
          <span style={ts.inputPrompt}>{'>'}</span>
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Ask about a payment (e.g. What happened to PTX-1006?)"
            style={ts.input}
            rows={1}
            disabled={loading}
          />
          <button
            style={{ ...ts.sendBtn, opacity: (!input.trim() || loading) ? 0.4 : 1 }}
            onClick={send}
            disabled={!input.trim() || loading}
          >
            {loading ? <span style={ts.spinner} /> : '↑'}
          </button>
        </div>
        <div style={ts.inputHint}>
          Enter to send · Shift+Enter for newline
        </div>
      </div>
    </div>
  );
}

const ts = {
  panel: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 24px',
    borderBottom: '1px solid var(--border)',
    background: 'var(--surface)',
    flexShrink: 0,
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
  },
  headerTitle: {
    fontFamily: 'var(--sans)',
    fontWeight: 700,
    fontSize: 15,
    color: 'var(--text)',
    letterSpacing: '-0.3px',
  },
  headerSession: {
    fontFamily: 'var(--mono)',
    fontSize: 10,
    color: 'var(--cyan)',
    background: 'var(--cyan-glow)',
    border: '1px solid var(--border2)',
    borderRadius: 4,
    padding: '2px 8px',
    display: 'flex',
    alignItems: 'center',
    gap: 5,
  },
  liveIndicator: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    background: 'var(--green)',
    boxShadow: '0 0 6px var(--green)',
    display: 'inline-block',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  statusChip: {
    fontFamily: 'var(--mono)',
    fontSize: 10,
    color: 'var(--cyan)',
    animation: 'shimmer 1.5s linear infinite',
  },
  messages: {
    flex: 1,
    overflowY: 'auto',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
  },
  msgRow: {
    display: 'flex',
    gap: 10,
    alignItems: 'flex-start',
  },
  agentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 8,
    background: 'linear-gradient(135deg, var(--cyan) 0%, #0055ff 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'var(--mono)',
    fontSize: 9,
    fontWeight: 700,
    color: '#fff',
    flexShrink: 0,
    boxShadow: '0 0 10px rgba(0,212,255,0.3)',
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 8,
    background: 'var(--surface2)',
    border: '1px solid var(--border)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'var(--mono)',
    fontSize: 9,
    color: 'var(--text-muted)',
    flexShrink: 0,
  },
  toolsRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 5,
    marginBottom: 6,
    alignItems: 'center',
  },
  toolsLabel: {
    fontFamily: 'var(--mono)',
    fontSize: 9,
    color: 'var(--text-dim)',
  },
  badge: {
    fontFamily: 'var(--mono)',
    fontSize: 9,
    padding: '2px 7px',
    borderRadius: 4,
    border: '1px solid',
    background: 'rgba(0,0,0,0.3)',
  },
  bubble: {
    padding: '12px 16px',
    borderRadius: 12,
    lineHeight: 1.6,
    fontSize: 14,
  },
  userBubble: {
    background: 'var(--cyan-glow)',
    border: '1px solid var(--border2)',
    borderBottomRightRadius: 4,
  },
  agentBubble: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderBottomLeftRadius: 4,
  },
  errorBubble: {
    background: 'rgba(255, 71, 87, 0.08)',
    border: '1px solid rgba(255, 71, 87, 0.3)',
    color: 'var(--red)',
  },
  userText: {
    color: 'var(--text)',
    fontFamily: 'var(--sans)',
    fontSize: 14,
  },
  markdownWrap: {
    color: 'var(--text)',
    fontFamily: 'var(--sans)',
    fontSize: 14,
    lineHeight: 1.7,
  },
  typingWrap: {
    display: 'flex',
    gap: 10,
    alignItems: 'flex-end',
  },
  typingBubble: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '12px 12px 12px 4px',
    padding: '12px 16px',
    display: 'flex',
    gap: 5,
    alignItems: 'center',
  },
  typingDot: {
    width: 7,
    height: 7,
    borderRadius: '50%',
    background: 'var(--cyan)',
    display: 'inline-block',
    animation: 'blink 1.2s ease-in-out infinite',
  },
  empty: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    padding: '40px 20px',
    textAlign: 'center',
  },
  emptyIcon: {
    fontSize: 52,
    background: 'linear-gradient(135deg, var(--cyan), #0055ff)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    lineHeight: 1,
    marginBottom: 4,
  },
  emptyTitle: {
    fontFamily: 'var(--sans)',
    fontWeight: 800,
    fontSize: 22,
    color: 'var(--text)',
    letterSpacing: '-0.5px',
  },
  emptySub: {
    fontFamily: 'var(--sans)',
    fontSize: 13,
    color: 'var(--text-muted)',
    lineHeight: 1.6,
    maxWidth: 420,
  },
  suggestions: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    marginTop: 8,
  },
  suggestBtn: {
    fontFamily: 'var(--mono)',
    fontSize: 11,
    color: 'var(--cyan)',
    background: 'var(--cyan-glow)',
    border: '1px solid var(--border2)',
    borderRadius: 6,
    padding: '6px 12px',
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  inputArea: {
    padding: '16px 24px 20px',
    borderTop: '1px solid var(--border)',
    background: 'var(--surface)',
    flexShrink: 0,
  },
  inputWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    background: 'var(--surface2)',
    border: '1px solid var(--border)',
    borderRadius: 12,
    padding: '10px 14px',
    transition: 'border-color 0.2s',
  },
  inputPrompt: {
    fontFamily: 'var(--mono)',
    fontSize: 14,
    color: 'var(--cyan)',
    flexShrink: 0,
    lineHeight: 1,
  },
  input: {
    flex: 1,
    background: 'transparent',
    border: 'none',
    outline: 'none',
    color: 'var(--text)',
    fontSize: 14,
    fontFamily: 'var(--sans)',
    resize: 'none',
    lineHeight: 1.5,
    maxHeight: 120,
  },
  sendBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    background: 'var(--cyan)',
    color: '#000',
    fontSize: 16,
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    flexShrink: 0,
    transition: 'all 0.15s',
  },
  spinner: {
    width: 14,
    height: 14,
    border: '2px solid rgba(0,0,0,0.2)',
    borderTopColor: '#000',
    borderRadius: '50%',
    display: 'inline-block',
    animation: 'spin 0.6s linear infinite',
  },
  inputHint: {
    fontFamily: 'var(--mono)',
    fontSize: 9,
    color: 'var(--text-dim)',
    textAlign: 'center',
    marginTop: 8,
    letterSpacing: '0.5px',
  },
};
