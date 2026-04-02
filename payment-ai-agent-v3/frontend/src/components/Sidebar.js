import React from 'react';

const TOOLS = [
  { name: 'get_call_ref',      desc: 'PTX → CallRef mapping',  color: '#2563EB', bg: '#EEF3FF' },
  { name: 'analyze_logs',      desc: 'Log error lookup',       color: '#D97706', bg: '#FEF3C7' },
  { name: 'check_transaction', desc: 'DB transaction status',  color: '#16A34A', bg: '#DCFCE7' },
  { name: 'get_pod_status',    desc: 'K8s pod health',         color: '#7C3AED', bg: '#EDE9FE' },
];

export default function Sidebar({ sessionId, pastSessions, onNewSession, onLoadSession, messageCount, viewingPast, agentStatus }) {
  const isActive = agentStatus === 'thinking';

  return (
    <aside style={s.aside}>
      {/* Brand */}
      <div style={s.brand}>
        <div style={s.brandIcon}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div>
          <div style={s.brandName}>PayAgent</div>
          <div style={s.brandSub}>Investigation Suite v3</div>
        </div>
      </div>

      {/* Session card */}
      <div style={s.sessionCard}>
        <div style={s.sessionTop}>
          <div style={s.sessionLeft}>
            <div style={{ ...s.statusDot, background: isActive ? '#F59E0B' : '#16A34A' }} />
            <span style={s.sessionLabel}>
              {viewingPast ? 'Past session' : 'Active session'}
            </span>
          </div>
          <span style={s.msgBadge}>{messageCount}</span>
        </div>
        <div style={s.sessionId}>
          {sessionId ? `SID-${sessionId}` : 'Initializing...'}
        </div>
        <button style={s.newBtn} onClick={onNewSession}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
          New session
        </button>
      </div>

      {/* Tools */}
      <div style={s.section}>
        <div style={s.sectionTitle}>Available Tools</div>
        <div style={s.toolsGrid}>
          {TOOLS.map(t => (
            <div key={t.name} style={s.toolCard}>
              <div style={{ ...s.toolDot, background: t.bg }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: t.color }} />
              </div>
              <div>
                <div style={{ ...s.toolName, color: t.color }}>{t.name}</div>
                <div style={s.toolDesc}>{t.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Past sessions */}
      <div style={s.section}>
        <div style={s.sectionTitle}>Past Sessions</div>
      </div>
      <div style={s.sessionList}>
        {pastSessions.length === 0 ? (
          <div style={s.emptyNote}>No saved sessions yet</div>
        ) : (
          [...pastSessions].reverse().map(ps => (
            <button
              key={ps.session_id}
              style={{
                ...s.pastCard,
                ...(sessionId === ps.session_id && viewingPast ? s.pastCardActive : {}),
              }}
              onClick={() => onLoadSession(ps)}
            >
              <div style={s.pastHeader}>
                <span style={s.pastId}>SID-{ps.session_id.slice(0, 8)}</span>
                {ps.query_count > 0 && <span style={s.pastCount}>{ps.query_count} queries</span>}
              </div>
              <div style={s.pastSummary}>
                {(ps.summary || 'No summary').slice(0, 72)}...
              </div>
            </button>
          ))
        )}
      </div>

      {/* Footer */}
      <div style={s.footer}>
        <span style={s.footerText}>LangGraph · FAISS · Groq · React</span>
        <span style={s.footerText}>UST Neural Nexus</span>
      </div>
    </aside>
  );
}

const s = {
  aside: {
    width: 268,
    minWidth: 268,
    background: 'var(--surface)',
    borderRight: '1px solid var(--border)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    boxShadow: '2px 0 12px rgba(0,0,0,0.04)',
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '22px 20px 18px',
    borderBottom: '1px solid var(--border)',
  },
  brandIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    background: 'var(--accent)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    boxShadow: '0 4px 12px rgba(37,99,235,0.3)',
  },
  brandName: {
    fontSize: 16,
    fontWeight: 700,
    color: 'var(--text)',
    letterSpacing: '-0.4px',
  },
  brandSub: {
    fontSize: 11,
    color: 'var(--text-3)',
    marginTop: 1,
    fontFamily: 'var(--mono)',
  },
  sessionCard: {
    margin: '16px 16px 0',
    padding: '14px 16px',
    background: 'var(--accent-light)',
    borderRadius: 'var(--radius)',
    border: '1px solid #DBEAFE',
  },
  sessionTop: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  sessionLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: '50%',
    flexShrink: 0,
  },
  sessionLabel: {
    fontSize: 11,
    fontWeight: 500,
    color: 'var(--accent)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  msgBadge: {
    fontSize: 10,
    fontWeight: 600,
    color: 'var(--accent)',
    background: 'var(--surface)',
    borderRadius: 20,
    padding: '1px 7px',
    fontFamily: 'var(--mono)',
  },
  sessionId: {
    fontSize: 12,
    fontFamily: 'var(--mono)',
    color: 'var(--text-2)',
    marginBottom: 10,
  },
  newBtn: {
    width: '100%',
    padding: '8px',
    background: 'var(--accent)',
    borderRadius: 8,
    color: '#fff',
    fontSize: 12,
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    justifyContent: 'center',
    transition: 'background var(--transition)',
    boxShadow: '0 2px 8px rgba(37,99,235,0.25)',
  },
  section: {
    padding: '18px 20px 8px',
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 600,
    color: 'var(--text-3)',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    marginBottom: 10,
  },
  toolsGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  toolCard: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '8px 10px',
    background: 'var(--surface2)',
    borderRadius: 8,
    border: '1px solid var(--border)',
  },
  toolDot: {
    width: 26,
    height: 26,
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  toolName: {
    fontSize: 11,
    fontFamily: 'var(--mono)',
    fontWeight: 500,
    marginBottom: 1,
  },
  toolDesc: {
    fontSize: 10,
    color: 'var(--text-3)',
  },
  sessionList: {
    flex: 1,
    overflowY: 'auto',
    padding: '0 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  pastCard: {
    width: '100%',
    textAlign: 'left',
    padding: '10px 12px',
    borderRadius: 'var(--radius)',
    background: 'var(--surface2)',
    border: '1px solid var(--border)',
    cursor: 'pointer',
    transition: 'all var(--transition)',
  },
  pastCardActive: {
    background: 'var(--accent-light)',
    border: '1px solid #BFDBFE',
  },
  pastHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  pastId: {
    fontSize: 11,
    fontFamily: 'var(--mono)',
    color: 'var(--accent)',
    fontWeight: 500,
  },
  pastCount: {
    fontSize: 10,
    color: 'var(--text-3)',
    fontFamily: 'var(--mono)',
  },
  pastSummary: {
    fontSize: 11,
    color: 'var(--text-2)',
    lineHeight: 1.5,
  },
  emptyNote: {
    fontSize: 12,
    color: 'var(--text-3)',
    textAlign: 'center',
    padding: '16px 0',
  },
  footer: {
    padding: '12px 20px',
    borderTop: '1px solid var(--border)',
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  footerText: {
    fontSize: 10,
    fontFamily: 'var(--mono)',
    color: 'var(--text-3)',
  },
};
