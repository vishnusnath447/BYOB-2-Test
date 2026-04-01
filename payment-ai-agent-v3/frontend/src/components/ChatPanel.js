import React, { useRef, useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';

const TOOL_COLORS = {
  get_call_ref:      'var(--accent)',
  analyze_logs:      'var(--amber)',
  check_transaction: 'var(--green)',
  get_pod_status:    '#a78bfa',
};

const SUGGESTIONS = [
  'List all failed payment transactions',
  'What happened to PTX-1006?',
  'Check the infrastructure status',
  'Investigate PTX-1003 in detail',
];

function ToolBadge({ name }) {
  const color = TOOL_COLORS[name] || 'var(--text-3)';
  return (
    <span style={{ ...ts.badge, color, borderColor: color + '33', background: color + '10' }}>
      {name}
    </span>
  );
}

function TypingIndicator() {
  return (
    <div style={ts.msgRow}>
      <div style={ts.avatar}>AI</div>
      <div style={{ ...ts.bubble, ...ts.agentBubble, padding: '12px 16px' }}>
        <div style={ts.typing}>
          {[0, 1, 2].map(i => (
            <span key={i} style={{ ...ts.typingDot, animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

function Message({ msg }) {
  const isUser  = msg.role === 'user';
  const isError = msg.role === 'error';

  return (
    <div style={{ ...ts.msgRow, flexDirection: isUser ? 'row-reverse' : 'row', animation: 'fadeUp 0.2s ease' }}>
      <div style={{ ...ts.avatar, ...(isUser ? ts.userAvatar : ts.agentAvatarStyle) }}>
        {isUser ? 'You' : 'AI'}
      </div>
      <div style={{ maxWidth: '72%', display: 'flex', flexDirection: 'column', gap: 5, alignItems: isUser ? 'flex-end' : 'flex-start' }}>
        {msg.tools && msg.tools.length > 0 && (
          <div style={ts.toolsRow}>
            {msg.tools.map((t, i) => <ToolBadge key={i} name={t} />)}
          </div>
        )}
        <div style={{
          ...ts.bubble,
          ...(isUser ? ts.userBubble : isError ? ts.errorBubble : ts.agentBubble),
        }}>
          {isUser ? (
            <span style={{ fontSize: 14, lineHeight: 1.6 }}>{msg.content}</span>
          ) : (
            <div style={ts.mdWrap}>
              <ReactMarkdown>{msg.content}</ReactMarkdown>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyState({ onSuggest, viewingPast }) {
  if (viewingPast) return (
    <div style={ts.empty}>
      <div style={ts.emptyIcon}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
          <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" stroke="var(--text-3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <div style={ts.emptyTitle}>Past Session</div>
      <div style={ts.emptySub}>This is a read-only view of a past session summary.<br/>Start a new session to investigate.</div>
    </div>
  );

  return (
    <div style={ts.empty}>
      <div style={ts.emptyIcon}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="var(--text-3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <div style={ts.emptyTitle}>Payment Investigation Agent</div>
      <div style={ts.emptySub}>Ask about any payment ID, failure, or infrastructure status.<br/>The agent investigates autonomously using 4 tools.</div>
      <div style={ts.suggestions}>
        {SUGGESTIONS.map(s => (
          <button key={s} style={ts.suggestBtn} onClick={() => onSuggest(s)}>{s}</button>
        ))}
      </div>
    </div>
  );
}

export default function ChatPanel({ messages, loading, agentStatus, onSend, sessionId, viewingPast, onNewSession }) {
  const [input, setInput]   = useState('');
  const bottomRef           = useRef(null);
  const inputRef            = useRef(null);
  const textareaRef         = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [input]);

  const send = () => {
    if (!input.trim() || loading || viewingPast) return;
    onSend(input.trim());
    setInput('');
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const statusText = { thinking: 'Thinking...', done: 'Done' }[agentStatus] || '';

  return (
    <div style={ts.panel}>
      {/* Header */}
      <div style={ts.header}>
        <div style={ts.headerLeft}>
          <span style={ts.headerTitle}>
            {viewingPast ? 'Past Session' : 'Investigation Console'}
          </span>
          {sessionId && (
            <span style={ts.sessionChip}>
              <span style={{ ...ts.chipDot, background: viewingPast ? 'var(--amber)' : 'var(--green)' }} />
              {sessionId.slice(0, 8)}
            </span>
          )}
          {viewingPast && (
            <span style={ts.readOnlyBadge}>Read only</span>
          )}
        </div>
        <div style={ts.headerRight}>
          {statusText && (
            <span style={ts.statusText}>{statusText}</span>
          )}
          {viewingPast && (
            <button style={ts.resumeBtn} onClick={onNewSession}>
              + New session
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div style={ts.messages}>
        {messages.length === 0 ? (
          <EmptyState onSuggest={(s) => { setInput(s); textareaRef.current?.focus(); }} viewingPast={viewingPast} />
        ) : (
          <>
            {messages.map(m => <Message key={m.id} msg={m} />)}
            {loading && <TypingIndicator />}
            <div ref={bottomRef} />
          </>
        )}
      </div>

      {/* Input */}
      {!viewingPast && (
        <div style={ts.inputArea}>
          <div style={{ ...ts.inputWrap, borderColor: loading ? 'rgba(37,99,235,0.3)' : 'var(--border)' }}>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask about a payment or infrastructure issue..."
              style={ts.input}
              rows={1}
              disabled={loading}
            />
            <button
              style={{ ...ts.sendBtn, opacity: (!input.trim() || loading) ? 0.4 : 1 }}
              onClick={send}
              disabled={!input.trim() || loading}
            >
              {loading
                ? <span style={ts.spinner} />
                : <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M12 5l7 7-7 7M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
              }
            </button>
          </div>
          <div style={ts.inputHint}>Enter to send · Shift+Enter for newline</div>
        </div>
      )}
    </div>
  );
}

const ts = {
  panel: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    background: 'var(--bg)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 24px',
    borderBottom: '1px solid var(--border)',
    background: 'var(--surface)',
    flexShrink: 0,
    minHeight: 54,
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: 'var(--text)',
    letterSpacing: '-0.2px',
  },
  sessionChip: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    fontSize: 11,
    fontFamily: 'var(--mono)',
    color: 'var(--text-2)',
    background: 'var(--surface2)',
    border: '1px solid var(--border)',
    borderRadius: 4,
    padding: '2px 7px',
  },
  chipDot: {
    width: 5,
    height: 5,
    borderRadius: '50%',
    flexShrink: 0,
  },
  readOnlyBadge: {
    fontSize: 10,
    fontWeight: 500,
    color: 'var(--amber)',
    background: 'var(--amber-dim)',
    border: '1px solid rgba(245,158,11,0.2)',
    borderRadius: 4,
    padding: '2px 7px',
    fontFamily: 'var(--mono)',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  statusText: {
    fontSize: 12,
    color: 'var(--text-3)',
    fontStyle: 'italic',
    animation: 'pulse 1.5s ease-in-out infinite',
  },
  resumeBtn: {
    fontSize: 12,
    fontWeight: 500,
    color: '#60a5fa',
    background: 'var(--accent-dim)',
    border: '1px solid rgba(37,99,235,0.2)',
    borderRadius: 'var(--radius)',
    padding: '5px 10px',
    cursor: 'pointer',
  },
  messages: {
    flex: 1,
    overflowY: 'auto',
    padding: '28px 24px',
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
  },
  msgRow: {
    display: 'flex',
    gap: 10,
    alignItems: 'flex-start',
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 6,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 10,
    fontWeight: 600,
    fontFamily: 'var(--mono)',
    flexShrink: 0,
  },
  agentAvatarStyle: {
    background: 'var(--accent)',
    color: '#fff',
  },
  userAvatar: {
    background: 'var(--surface3)',
    color: 'var(--text-2)',
    border: '1px solid var(--border)',
  },
  bubble: {
    padding: '10px 14px',
    borderRadius: 10,
    lineHeight: 1.65,
    fontSize: 14,
  },
  agentBubble: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderTopLeftRadius: 3,
    color: 'var(--text)',
  },
  userBubble: {
    background: 'var(--accent-dim)',
    border: '1px solid rgba(37,99,235,0.2)',
    borderTopRightRadius: 3,
    color: 'var(--text)',
  },
  errorBubble: {
    background: 'var(--red-dim)',
    border: '1px solid rgba(239,68,68,0.2)',
    color: 'var(--red)',
    borderTopLeftRadius: 3,
  },
  mdWrap: {
    color: 'var(--text)',
    fontSize: 14,
    lineHeight: 1.7,
  },
  toolsRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 4,
  },
  badge: {
    fontSize: 10,
    fontFamily: 'var(--mono)',
    padding: '2px 6px',
    borderRadius: 4,
    border: '1px solid',
  },
  typing: {
    display: 'flex',
    gap: 4,
    alignItems: 'center',
    height: 16,
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    background: 'var(--text-3)',
    display: 'inline-block',
    animation: 'typingBounce 1s ease-in-out infinite',
  },
  empty: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: '40px 20px',
    textAlign: 'center',
    animation: 'fadeIn 0.3s ease',
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: 600,
    color: 'var(--text)',
    letterSpacing: '-0.3px',
  },
  emptySub: {
    fontSize: 13,
    color: 'var(--text-2)',
    lineHeight: 1.6,
    maxWidth: 400,
  },
  suggestions: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'center',
    marginTop: 6,
    maxWidth: 520,
  },
  suggestBtn: {
    fontSize: 12,
    color: 'var(--text-2)',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 6,
    padding: '6px 12px',
    cursor: 'pointer',
    transition: 'all var(--transition)',
    fontWeight: 400,
  },
  inputArea: {
    padding: '14px 24px 18px',
    borderTop: '1px solid var(--border)',
    background: 'var(--surface)',
    flexShrink: 0,
  },
  inputWrap: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: 8,
    background: 'var(--surface2)',
    border: '1px solid',
    borderRadius: 'var(--radius-lg)',
    padding: '10px 10px 10px 14px',
    transition: 'border-color var(--transition)',
  },
  input: {
    flex: 1,
    background: 'transparent',
    border: 'none',
    outline: 'none',
    color: 'var(--text)',
    fontSize: 14,
    resize: 'none',
    lineHeight: 1.5,
    padding: 0,
    minHeight: 22,
  },
  sendBtn: {
    width: 30,
    height: 30,
    borderRadius: 6,
    background: 'var(--accent)',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    transition: 'all var(--transition)',
  },
  spinner: {
    width: 12,
    height: 12,
    border: '2px solid rgba(255,255,255,0.3)',
    borderTopColor: '#fff',
    borderRadius: '50%',
    display: 'inline-block',
    animation: 'spin 0.6s linear infinite',
  },
  inputHint: {
    fontSize: 10,
    color: 'var(--text-3)',
    textAlign: 'center',
    marginTop: 7,
    fontFamily: 'var(--mono)',
  },
};
