import React, { useRef, useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';

const TOOL_COLORS = {
  get_call_ref:      { color: '#2563EB', bg: '#EEF3FF' },
  analyze_logs:      { color: '#D97706', bg: '#FEF3C7' },
  check_transaction: { color: '#16A34A', bg: '#DCFCE7' },
  get_pod_status:    { color: '#7C3AED', bg: '#EDE9FE' },
};

const SUGGESTIONS = [
  'List all failed payment transactions',
  'What happened to PTX-1006?',
  'Check the infrastructure status',
  'Investigate PTX-1003 in detail',
];

function ToolBadge({ name }) {
  const style = TOOL_COLORS[name] || { color: '#64748B', bg: '#F1F5F9' };
  return (
    <span style={{ ...ts.badge, color: style.color, background: style.bg }}>
      {name}
    </span>
  );
}

function TypingIndicator() {
  return (
    <div style={ts.msgRow}>
      <div style={ts.agentAvatar}>AI</div>
      <div style={{ ...ts.bubble, ...ts.agentBubble, padding: '14px 16px' }}>
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
    <div style={{
      ...ts.msgRow,
      flexDirection: isUser ? 'row-reverse' : 'row',
      animation: 'fadeUp 0.25s ease',
    }}>
      <div style={{ ...ts.avatar, ...(isUser ? ts.userAvatar : ts.agentAvatar) }}>
        {isUser ? 'You' : 'AI'}
      </div>
      <div style={{
        maxWidth: '70%',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        alignItems: isUser ? 'flex-end' : 'flex-start',
      }}>
        {msg.tools && msg.tools.length > 0 && (
          <div style={ts.toolsRow}>
            <span style={ts.toolsLabel}>Tools used:</span>
            {msg.tools.map((t, i) => <ToolBadge key={i} name={t} />)}
          </div>
        )}
        <div style={{
          ...ts.bubble,
          ...(isUser ? ts.userBubble : isError ? ts.errorBubble : ts.agentBubble),
        }}>
          {isUser ? (
            <span style={ts.userText}>{msg.content}</span>
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
      <div style={ts.emptyIconWrap}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
          <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <div style={ts.emptyTitle}>Viewing Past Session</div>
      <div style={ts.emptySub}>This is a read-only summary. Start a new session to investigate.</div>
    </div>
  );

  return (
    <div style={ts.empty}>
      <div style={ts.emptyIconWrap}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"
            stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
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

export default function ChatPanel({ messages, loading, agentStatus, onSend, sessionId, viewingPast, onNewSession }) {
  const [input, setInput] = useState('');
  const bottomRef         = useRef(null);
  const textareaRef       = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

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

  return (
    <div style={ts.panel}>
      {/* Header */}
      <div style={ts.header}>
        <div style={ts.headerLeft}>
          <div style={ts.headerTitle}>Investigation Console</div>
          {sessionId && (
            <div style={ts.sessionChip}>
              <span style={{ ...ts.chipDot, background: viewingPast ? '#D97706' : '#16A34A' }} />
              <span style={ts.chipText}>SID-{sessionId}</span>
            </div>
          )}
          {viewingPast && <span style={ts.readOnlyBadge}>Read only</span>}
        </div>
        <div style={ts.headerRight}>
          {agentStatus === 'thinking' && (
            <span style={ts.thinkingChip}>
              <span style={ts.thinkingDot} />
              Investigating...
            </span>
          )}
          {viewingPast && (
            <button style={ts.newSessionBtn} onClick={onNewSession}>
              + New session
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div style={ts.messages}>
        {messages.length === 0 ? (
          <EmptyState
            onSuggest={s => { setInput(s); textareaRef.current?.focus(); }}
            viewingPast={viewingPast}
          />
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
          <div style={ts.inputCard}>
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
                : <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z"
                      stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
              }
            </button>
          </div>
          <div style={ts.inputHint}>Press Enter to send · Shift+Enter for new line</div>
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
    padding: '16px 28px',
    background: 'var(--surface)',
    borderBottom: '1px solid var(--border)',
    flexShrink: 0,
    boxShadow: 'var(--shadow-sm)',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: 600,
    color: 'var(--text)',
    letterSpacing: '-0.3px',
  },
  sessionChip: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    background: 'var(--surface2)',
    border: '1px solid var(--border)',
    borderRadius: 20,
    padding: '3px 10px',
  },
  chipDot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    flexShrink: 0,
  },
  chipText: {
    fontSize: 11,
    fontFamily: 'var(--mono)',
    color: 'var(--text-2)',
  },
  readOnlyBadge: {
    fontSize: 10,
    fontWeight: 600,
    color: '#D97706',
    background: '#FEF3C7',
    border: '1px solid #FDE68A',
    borderRadius: 20,
    padding: '3px 10px',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  thinkingChip: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 12,
    color: 'var(--accent)',
    fontWeight: 500,
    background: 'var(--accent-light)',
    borderRadius: 20,
    padding: '4px 12px',
  },
  thinkingDot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    background: 'var(--accent)',
    display: 'inline-block',
    animation: 'pulse 1s ease-in-out infinite',
  },
  newSessionBtn: {
    fontSize: 12,
    fontWeight: 600,
    color: 'var(--accent)',
    background: 'var(--accent-light)',
    border: '1px solid #BFDBFE',
    borderRadius: 8,
    padding: '6px 14px',
    cursor: 'pointer',
  },
  messages: {
    flex: 1,
    overflowY: 'auto',
    padding: '28px',
    display: 'flex',
    flexDirection: 'column',
    gap: 22,
  },
  msgRow: {
    display: 'flex',
    gap: 12,
    alignItems: 'flex-start',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 10,
    fontWeight: 700,
    fontFamily: 'var(--mono)',
    flexShrink: 0,
  },
  agentAvatar: {
    background: 'var(--accent)',
    color: '#fff',
    boxShadow: '0 2px 8px rgba(37,99,235,0.25)',
  },
  userAvatar: {
    background: 'var(--surface)',
    color: 'var(--text-2)',
    border: '1px solid var(--border)',
  },
  toolsRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 5,
    alignItems: 'center',
  },
  toolsLabel: {
    fontSize: 10,
    color: 'var(--text-3)',
    fontWeight: 500,
  },
  badge: {
    fontSize: 10,
    fontFamily: 'var(--mono)',
    fontWeight: 500,
    padding: '2px 8px',
    borderRadius: 20,
  },
  bubble: {
    padding: '12px 16px',
    borderRadius: 'var(--radius)',
    fontSize: 14,
    lineHeight: 1.65,
    boxShadow: 'var(--shadow-sm)',
  },
  agentBubble: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderTopLeftRadius: 4,
    color: 'var(--text)',
  },
  userBubble: {
    background: 'var(--accent)',
    border: 'none',
    borderTopRightRadius: 4,
    color: '#fff',
    boxShadow: '0 2px 12px rgba(37,99,235,0.2)',
  },
  errorBubble: {
    background: '#FEE2E2',
    border: '1px solid #FECACA',
    color: 'var(--red)',
    borderTopLeftRadius: 4,
  },
  userText: {
    fontSize: 14,
    lineHeight: 1.6,
    color: '#fff',
  },
  mdWrap: {
    color: 'var(--text)',
    fontSize: 14,
    lineHeight: 1.7,
  },
  typing: {
    display: 'flex',
    gap: 5,
    alignItems: 'center',
    height: 18,
  },
  typingDot: {
    width: 7,
    height: 7,
    borderRadius: '50%',
    background: 'var(--accent)',
    opacity: 0.5,
    display: 'inline-block',
    animation: 'typingBounce 1s ease-in-out infinite',
  },
  empty: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    padding: '48px 24px',
    textAlign: 'center',
    animation: 'fadeIn 0.3s ease',
  },
  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 20,
    background: 'var(--accent-light)',
    border: '1px solid #BFDBFE',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    boxShadow: '0 4px 16px rgba(37,99,235,0.1)',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 700,
    color: 'var(--text)',
    letterSpacing: '-0.4px',
  },
  emptySub: {
    fontSize: 14,
    color: 'var(--text-2)',
    lineHeight: 1.65,
    maxWidth: 420,
  },
  suggestions: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    marginTop: 8,
    maxWidth: 540,
  },
  suggestBtn: {
    fontSize: 12,
    fontWeight: 500,
    color: 'var(--accent)',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 20,
    padding: '7px 16px',
    cursor: 'pointer',
    boxShadow: 'var(--shadow-sm)',
    transition: 'all var(--transition)',
  },
  inputArea: {
    padding: '16px 28px 22px',
    background: 'var(--surface)',
    borderTop: '1px solid var(--border)',
    flexShrink: 0,
  },
  inputCard: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: 10,
    background: 'var(--surface2)',
    border: '1.5px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    padding: '12px 12px 12px 18px',
    boxShadow: 'var(--shadow-sm)',
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
    minHeight: 22,
    maxHeight: 120,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    background: 'var(--accent)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    boxShadow: '0 2px 8px rgba(37,99,235,0.3)',
    transition: 'all var(--transition)',
  },
  spinner: {
    width: 14,
    height: 14,
    border: '2px solid rgba(255,255,255,0.3)',
    borderTopColor: '#fff',
    borderRadius: '50%',
    display: 'inline-block',
    animation: 'spin 0.7s linear infinite',
  },
  inputHint: {
    fontSize: 11,
    color: 'var(--text-3)',
    textAlign: 'center',
    marginTop: 8,
  },
};
