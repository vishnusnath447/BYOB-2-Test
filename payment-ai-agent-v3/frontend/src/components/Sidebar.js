import React, { useState } from 'react';

const TOOLS = [
  { name: 'get_call_ref',      desc: 'PTX → CallRef mapping',   color: 'var(--accent)'  },
  { name: 'analyze_logs',      desc: 'Log error lookup',        color: 'var(--amber)'   },
  { name: 'check_transaction', desc: 'DB transaction status',   color: 'var(--green)'   },
  { name: 'get_pod_status',    desc: 'K8s pod health',          color: '#a78bfa'        },
];

export default function Sidebar({ sessionId, pastSessions, onNewSession, onLoadSession, messageCount, viewingPast, agentStatus }) {
  const [expanded, setExpanded] = useState(null);

  const statusColor = {
    idle:    'var(--green)',
    thinking:'var(--accent)',
    done:    'var(--green)',
  }[agentStatus] || 'var(--text-3)';

  const statusLabel = {
    idle:    'Ready',
    thinking:'Processing',
    done:    'Complete',
  }[agentStatus] || 'Ready';

  return (
    <aside style={s.sidebar}>
      {/* Brand */}
      <div style={s.brand}>
        <div style={s.brandIcon}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div>
          <div style={s.brandName}>PayAgent</div>
          <div style={s.brandVersion}>v3.0 · Neural Nexus</div>
        </div>
      </div>

      <div style={s.divider} />

      {/* Status + New session */}
      <div style={s.section}>
        <div style={s.sessionRow}>
          <div style={s.sessionInfo}>
            <div style={{ ...s.statusDot, background: statusColor }} />
            <span style={s.sessionId}>
              {viewingPast ? `Viewing past session` : sessionId ? `Session ${sessionId}` : 'Initializing...'}
            </span>
          </div>
          <span style={s.msgCount}>{messageCount} msg</span>
        </div>
        <button style={s.newBtn} onClick={onNewSession}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          New session
        </button>
      </div>

      <div style={s.divider} />

      {/* Tools */}
      <div style={s.section}>
        <div style={s.sectionTitle}>Tools</div>
        <div style={s.toolsList}>
          {TOOLS.map(t => (
            <div key={t.name} style={s.toolItem}>
              <div style={{ ...s.toolDot, background: t.color }} />
              <div>
                <div style={s.toolName}>{t.name}</div>
                <div style={s.toolDesc}>{t.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={s.divider} />

      {/* Past sessions */}
      <div style={{ ...s.section, flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={s.sectionTitle}>Past Sessions</div>
        <div style={s.sessionList}>
          {pastSessions.length === 0 ? (
            <div style={s.emptyNote}>No saved sessions yet.<br/>Save a session to see it here.</div>
          ) : (
            [...pastSessions].reverse().map(ps => (
              <button
                key={ps.session_id}
                style={{
                  ...s.pastItem,
                  ...(sessionId === ps.session_id && viewingPast ? s.pastItemActive : {}),
                }}
                onClick={() => onLoadSession(ps)}
              >
                <div style={s.pastItemHeader}>
                  <span style={s.pastId}>{ps.session_id.slice(0, 8)}</span>
                  {ps.query_count > 0 && (
                    <span style={s.pastCount}>{ps.query_count} queries</span>
                  )}
                </div>
                <div style={s.pastSummary}>
                  {(ps.summary || 'No summary available').slice(0, 80)}...
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Footer */}
      <div style={s.footer}>
        <span style={s.footerText}>LangGraph · FAISS · Groq Llama 3.3</span>
      </div>
    </aside>
  );
}

const s = {
  sidebar: {
    width: 252,
    minWidth: 252,
    background: 'var(--surface)',
    borderRight: '1px solid var(--border)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '18px 16px 16px',
  },
  brandIcon: {
    width: 34,
    height: 34,
    borderRadius: 8,
    background: 'var(--accent)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  brandName: {
    fontSize: 15,
    fontWeight: 600,
    color: 'var(--text)',
    letterSpacing: '-0.3px',
  },
  brandVersion: {
    fontSize: 11,
    color: 'var(--text-3)',
    marginTop: 1,
    fontFamily: 'var(--mono)',
  },
  divider: {
    height: 1,
    background: 'var(--border)',
    margin: '0 16px',
  },
  section: {
    padding: '14px 16px',
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 500,
    color: 'var(--text-3)',
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  sessionRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sessionInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: 7,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: '50%',
    flexShrink: 0,
    transition: 'background var(--transition)',
  },
  sessionId: {
    fontSize: 12,
    fontFamily: 'var(--mono)',
    color: 'var(--text-2)',
  },
  msgCount: {
    fontSize: 11,
    color: 'var(--text-3)',
    fontFamily: 'var(--mono)',
  },
  newBtn: {
    width: '100%',
    padding: '7px 12px',
    background: 'var(--accent-dim)',
    border: '1px solid rgba(37,99,235,0.2)',
    borderRadius: 'var(--radius)',
    color: '#60a5fa',
    fontSize: 12,
    fontWeight: 500,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    justifyContent: 'center',
    transition: 'all var(--transition)',
  },
  toolsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  toolItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 9,
  },
  toolDot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    marginTop: 5,
    flexShrink: 0,
  },
  toolName: {
    fontSize: 12,
    fontFamily: 'var(--mono)',
    color: 'var(--text-2)',
    marginBottom: 1,
  },
  toolDesc: {
    fontSize: 11,
    color: 'var(--text-3)',
  },
  sessionList: {
    flex: 1,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  pastItem: {
    width: '100%',
    textAlign: 'left',
    padding: '9px 10px',
    borderRadius: 'var(--radius)',
    background: 'transparent',
    border: '1px solid transparent',
    cursor: 'pointer',
    transition: 'all var(--transition)',
  },
  pastItemActive: {
    background: 'var(--accent-dim2)',
    border: '1px solid rgba(37,99,235,0.2)',
  },
  pastItemHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  pastId: {
    fontSize: 11,
    fontFamily: 'var(--mono)',
    color: 'var(--accent-hover)',
  },
  pastCount: {
    fontSize: 10,
    color: 'var(--text-3)',
    fontFamily: 'var(--mono)',
  },
  pastSummary: {
    fontSize: 11,
    color: 'var(--text-3)',
    lineHeight: 1.5,
  },
  emptyNote: {
    fontSize: 11,
    color: 'var(--text-3)',
    lineHeight: 1.6,
    padding: '4px 2px',
  },
  footer: {
    padding: '10px 16px',
    borderTop: '1px solid var(--border)',
  },
  footerText: {
    fontSize: 10,
    fontFamily: 'var(--mono)',
    color: 'var(--text-3)',
  },
};
