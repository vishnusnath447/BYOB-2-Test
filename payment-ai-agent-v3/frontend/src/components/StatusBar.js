import React from 'react';

export default function StatusBar({ agentStatus, sessionId, messageCount }) {
  const statusMap = {
    idle:         { text: 'Ready',      color: 'var(--text-dim)'   },
    thinking:     { text: 'Reasoning',  color: 'var(--cyan)'       },
    'calling-tool': { text: 'Tool call', color: 'var(--amber)'     },
    done:         { text: 'Complete',   color: 'var(--green)'      },
  };
  const status = statusMap[agentStatus] || statusMap.idle;

  return (
    <div style={s.bar}>
      <span style={s.item}>
        <span style={{ ...s.indicator, background: status.color, boxShadow: `0 0 5px ${status.color}` }} />
        <span style={{ color: status.color, fontFamily: 'var(--mono)', fontSize: 10 }}>{status.text}</span>
      </span>
      <span style={s.sep}>|</span>
      <span style={s.item}>
        <span style={s.label}>Stack:</span>
        <span style={s.value}>LangGraph · FAISS · Groq Llama 3.3 70B</span>
      </span>
      <span style={s.sep}>|</span>
      <span style={s.item}>
        <span style={s.label}>Messages:</span>
        <span style={s.value}>{messageCount}</span>
      </span>
      <div style={s.right}>
        <span style={s.item}>
          <span style={s.label}>v3.0.0</span>
        </span>
      </div>
    </div>
  );
}

const s = {
  bar: {
    height: 26,
    background: 'var(--surface)',
    borderTop: '1px solid var(--border)',
    display: 'flex',
    alignItems: 'center',
    padding: '0 16px',
    gap: 10,
    flexShrink: 0,
  },
  item: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
  },
  indicator: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    display: 'inline-block',
    flexShrink: 0,
  },
  sep: {
    color: 'var(--border)',
    fontSize: 12,
    userSelect: 'none',
  },
  label: {
    fontFamily: 'var(--mono)',
    fontSize: 9,
    color: 'var(--text-dim)',
  },
  value: {
    fontFamily: 'var(--mono)',
    fontSize: 9,
    color: 'var(--text-muted)',
  },
  right: {
    marginLeft: 'auto',
  },
};
