import React from 'react';

const TOOLS_INFO = [
  { name: 'get_call_ref',      icon: '🔗', desc: 'PTX → CallRef mapping'     },
  { name: 'analyze_logs',      icon: '📋', desc: 'Log error lookup'           },
  { name: 'check_transaction', icon: '🗄',  desc: 'DB transaction status'      },
  { name: 'get_pod_status',    icon: '🖥',  desc: 'K8s pod health'            },
];

export default function Sidebar({ sessionId, pastSessions, onNewSession, messageCount }) {
  return (
    <aside style={s.aside}>
      {/* Logo */}
      <div style={s.logo}>
        <div style={s.logoIcon}>
          <span style={s.logoSymbol}>⬡</span>
        </div>
        <div>
          <div style={s.logoTitle}>PayAgent</div>
          <div style={s.logoSub}>Investigation Suite v3</div>
        </div>
      </div>

      <div style={s.divider} />

      {/* Session info */}
      <div style={s.section}>
        <div style={s.sectionLabel}>CURRENT SESSION</div>
        <div style={s.sessionCard}>
          <div style={s.sessionId}>
            <span style={s.dot} />
            {sessionId ? `SID-${sessionId}` : 'Initializing...'}
          </div>
          <div style={s.sessionMeta}>{messageCount} messages</div>
        </div>
        <button style={s.newBtn} onClick={onNewSession}>
          <span>＋</span> New Session
        </button>
      </div>

      <div style={s.divider} />

      {/* Tools */}
      <div style={s.section}>
        <div style={s.sectionLabel}>AVAILABLE TOOLS</div>
        {TOOLS_INFO.map(t => (
          <div key={t.name} style={s.toolRow}>
            <span style={s.toolIcon}>{t.icon}</span>
            <div>
              <div style={s.toolName}>{t.name}</div>
              <div style={s.toolDesc}>{t.desc}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={s.divider} />

      {/* Past sessions */}
      <div style={{ ...s.section, flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={s.sectionLabel}>PAST SESSIONS</div>
        <div style={s.sessionList}>
          {pastSessions.length === 0 ? (
            <div style={s.emptyText}>No saved sessions yet</div>
          ) : (
            pastSessions.slice().reverse().map(ps => (
              <div key={ps.session_id} style={s.pastCard}>
                <div style={s.pastId}>SID-{ps.session_id.slice(0, 8)}</div>
                <div style={s.pastSummary}>{ps.summary || 'No summary'}</div>
                {ps.query_count > 0 && (
                  <div style={s.pastMeta}>{ps.query_count} queries</div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Footer */}
      <div style={s.footer}>
        <div style={s.footerTag}>LangGraph · FAISS · Groq</div>
        <div style={s.footerTag}>UST Neural Nexus</div>
      </div>
    </aside>
  );
}

const s = {
  aside: {
    width: 260,
    minWidth: 260,
    background: 'var(--surface)',
    borderRight: '1px solid var(--border)',
    display: 'flex',
    flexDirection: 'column',
    padding: '0',
    overflow: 'hidden',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '20px 18px 16px',
  },
  logoIcon: {
    width: 40,
    height: 40,
    background: 'linear-gradient(135deg, var(--cyan) 0%, #0055ff 100%)',
    borderRadius: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    boxShadow: '0 0 16px rgba(0, 212, 255, 0.35)',
  },
  logoSymbol: {
    fontSize: 20,
    color: '#fff',
    lineHeight: 1,
  },
  logoTitle: {
    fontFamily: 'var(--sans)',
    fontWeight: 800,
    fontSize: 17,
    color: 'var(--text)',
    letterSpacing: '-0.5px',
  },
  logoSub: {
    fontFamily: 'var(--mono)',
    fontSize: 9,
    color: 'var(--text-muted)',
    letterSpacing: '0.5px',
    marginTop: 1,
  },
  divider: {
    height: 1,
    background: 'var(--border)',
    margin: '0 18px',
  },
  section: {
    padding: '14px 18px',
  },
  sectionLabel: {
    fontFamily: 'var(--mono)',
    fontSize: 9,
    color: 'var(--text-dim)',
    letterSpacing: '1.5px',
    marginBottom: 10,
  },
  sessionCard: {
    background: 'var(--surface2)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    padding: '8px 12px',
    marginBottom: 8,
  },
  sessionId: {
    fontFamily: 'var(--mono)',
    fontSize: 11,
    color: 'var(--cyan)',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    background: 'var(--green)',
    boxShadow: '0 0 6px var(--green)',
    display: 'inline-block',
    animation: 'pulse-glow 2s ease-in-out infinite',
  },
  sessionMeta: {
    fontFamily: 'var(--mono)',
    fontSize: 9,
    color: 'var(--text-muted)',
    marginTop: 3,
  },
  newBtn: {
    width: '100%',
    padding: '8px 12px',
    background: 'transparent',
    border: '1px solid var(--border2)',
    borderRadius: 8,
    color: 'var(--cyan)',
    fontFamily: 'var(--mono)',
    fontSize: 11,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    justifyContent: 'center',
    transition: 'all 0.2s',
  },
  toolRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 10,
  },
  toolIcon: {
    fontSize: 14,
    marginTop: 1,
    flexShrink: 0,
  },
  toolName: {
    fontFamily: 'var(--mono)',
    fontSize: 10,
    color: 'var(--cyan)',
    marginBottom: 2,
  },
  toolDesc: {
    fontFamily: 'var(--sans)',
    fontSize: 10,
    color: 'var(--text-muted)',
  },
  sessionList: {
    flex: 1,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  pastCard: {
    background: 'var(--surface2)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    padding: '8px 10px',
  },
  pastId: {
    fontFamily: 'var(--mono)',
    fontSize: 9,
    color: 'var(--cyan-dim)',
    marginBottom: 3,
  },
  pastSummary: {
    fontFamily: 'var(--sans)',
    fontSize: 10,
    color: 'var(--text-muted)',
    lineHeight: 1.4,
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
  pastMeta: {
    fontFamily: 'var(--mono)',
    fontSize: 9,
    color: 'var(--text-dim)',
    marginTop: 4,
  },
  emptyText: {
    fontFamily: 'var(--mono)',
    fontSize: 10,
    color: 'var(--text-dim)',
    textAlign: 'center',
    padding: '12px 0',
  },
  footer: {
    padding: '12px 18px',
    borderTop: '1px solid var(--border)',
    display: 'flex',
    flexDirection: 'column',
    gap: 3,
  },
  footerTag: {
    fontFamily: 'var(--mono)',
    fontSize: 9,
    color: 'var(--text-dim)',
  },
};
