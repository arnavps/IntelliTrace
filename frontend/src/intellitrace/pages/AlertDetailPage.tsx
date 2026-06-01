import { useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import CytoscapeComponent from 'react-cytoscapejs';
import type { ElementDefinition } from 'cytoscape';
import {
  ArrowLeft,
  Clock,
  ShieldAlert,
  ArrowDownToLine,
  ArrowUpFromLine,
  Shuffle,
  Banknote,
  Bell,
  Globe,
  User,
  Cpu,
  FileText,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Folder,
  XCircle,
  Send,
  Zap,
  Loader,
  AlertCircle,
} from 'lucide-react';
import '../styles/dashboard.css';
import { useApi, apiPatch } from '../../hooks/useApi';

/* ─── Types ─────────────────────────────────────────── */
interface AlertDetail {
  id: string;
  type: string;
  account_id: string;
  amount: number;
  amount_formatted: string;
  risk_score: number;
  risk_level: 'critical' | 'high' | 'medium' | 'low';
  status: string;
  description: string;
  flag_reason: string;
  timestamp: string;
}

interface TimelineEvent {
  time: string;
  title: string;
  desc: string;
  amount?: string;
  type: 'deposit' | 'transfer' | 'swift' | 'split' | 'withdrawal' | 'alert';
}

/* ─── Static illustrative timeline (displayed alongside live data) ── */
const TIMELINE_EVENTS: TimelineEvent[] = [
  { time: '10:00 AM', title: 'Large Deposit Received', desc: 'Deposit from flagged sender account', amount: '+₹5,00,000', type: 'deposit' },
  { time: '10:02 AM', title: 'Rapid Transfer to Shell Corp', desc: 'Immediate transfer of 96% of received funds', amount: '-₹4,80,000', type: 'transfer' },
  { time: '10:05 AM', title: 'SWIFT to Offshore Bank', desc: 'International wire transfer via Mauritius SWIFT corridor', amount: '-₹3,20,000', type: 'swift' },
  { time: '10:08 AM', title: 'Smurfing: Split Across 5 Accounts', desc: 'Funds split into 5 sub-threshold transactions (₹90K each)', amount: '-₹4,50,000', type: 'split' },
  { time: '10:11 AM', title: 'ATM Withdrawal Cluster', desc: 'Cash withdrawal via 3 ATMs within 2km radius', amount: '-₹4,50,000', type: 'withdrawal' },
  { time: '10:15 AM', title: 'Alert Triggered by GraphSAGE', desc: 'System detected syndicate pattern — alert escalated to L2', amount: undefined, type: 'alert' },
];

/* ─── Cytoscape Graph Elements ──────────────────────── */
const buildGraphElements = (accountId: string): ElementDefinition[] => [
  { data: { id: 'acc_main', label: accountId, type: 'main', risk: 94 } },
  { data: { id: 'acc_src1', label: 'ACC-SRC1', type: 'source', risk: 87 } },
  { data: { id: 'acc_shell', label: 'Shell Corp α', type: 'shell', risk: 96 } },
  { data: { id: 'acc_offshore', label: 'Offshore Bank', type: 'offshore', risk: 99 } },
  { data: { id: 'acc_k1', label: 'ACC-K1', type: 'connected', risk: 71 } },
  { data: { id: 'acc_k2', label: 'ACC-K2', type: 'connected', risk: 82 } },
  { data: { id: 'e1', source: 'acc_src1', target: 'acc_main', label: '₹5L', type: 'deposit' } },
  { data: { id: 'e2', source: 'acc_main', target: 'acc_shell', label: '₹4.8L', type: 'transfer' } },
  { data: { id: 'e3', source: 'acc_shell', target: 'acc_offshore', label: 'SWIFT', type: 'swift' } },
  { data: { id: 'e4', source: 'acc_main', target: 'acc_k1', label: '₹90K', type: 'split' } },
  { data: { id: 'e5', source: 'acc_main', target: 'acc_k2', label: '₹90K', type: 'split' } },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CY_STYLESHEET: any = [
  {
    selector: 'node',
    style: {
      'background-color': '#222222',
      'border-width': 3,
      'border-color': '#2A2A2A',
      'color': '#fff',
      'font-size': 10,
      'text-valign': 'bottom' as const,
      'text-margin-y': 6,
      'label': 'data(label)',
      'width': 44,
      'height': 44,
    },
  },
  { selector: 'node[type="main"]', style: { 'background-color': '#1A0A0A', 'border-color': '#EF4444', 'border-width': 4, 'width': 56, 'height': 56 } },
  { selector: 'node[type="source"]', style: { 'border-color': '#F97316' } },
  { selector: 'node[type="shell"]', style: { 'border-color': '#EF4444', 'background-color': '#1A0A0A' } },
  { selector: 'node[type="offshore"]', style: { 'border-color': '#DC2626', 'background-color': '#1A0505' } },
  { selector: 'node[type="connected"]', style: { 'border-color': '#EAB308' } },
  {
    selector: 'edge',
    style: {
      'width': 2, 'line-color': '#2A2A2A', 'target-arrow-color': '#2A2A2A',
      'target-arrow-shape': 'triangle' as const, 'curve-style': 'bezier' as const,
      'font-size': 9, 'color': '#999', 'label': 'data(label)',
      'text-background-color': '#1A1A1A', 'text-background-opacity': 1, 'text-background-padding': '2px',
    },
  },
  { selector: 'edge[type="transfer"], edge[type="swift"]', style: { 'line-color': '#EF4444', 'target-arrow-color': '#EF4444' } },
  { selector: 'edge[type="deposit"]', style: { 'line-color': '#F97316', 'target-arrow-color': '#F97316' } },
  { selector: 'edge[type="split"]', style: { 'line-color': '#EAB308', 'target-arrow-color': '#EAB308' } },
];

/* ─── Sub-components ────────────────────────────────── */
function TimelineIcon({ type }: { type: TimelineEvent['type'] }) {
  const map = {
    deposit: { icon: <ArrowDownToLine size={13} />, color: '#F97316', border: 'rgba(249,115,22,0.4)' },
    transfer: { icon: <ArrowUpFromLine size={13} />, color: '#EF4444', border: 'rgba(239,68,68,0.4)' },
    swift: { icon: <Globe size={13} />, color: '#EF4444', border: 'rgba(239,68,68,0.4)' },
    split: { icon: <Shuffle size={13} />, color: '#EAB308', border: 'rgba(234,179,8,0.4)' },
    withdrawal: { icon: <Banknote size={13} />, color: '#EAB308', border: 'rgba(234,179,8,0.4)' },
    alert: { icon: <Bell size={13} />, color: '#F5A623', border: 'rgba(245,166,35,0.4)' },
  };
  const { icon, color, border } = map[type];
  return <div className="it-timeline-dot" style={{ color, borderColor: border, boxShadow: `0 0 10px ${border}` }}>{icon}</div>;
}

function RiskBadge({ risk }: { risk: 'critical' | 'high' | 'medium' | 'low' }) {
  return <span className={`it-badge it-badge-${risk}`}>{risk}</span>;
}

function RiskCircle({ score, risk }: { score: number; risk: 'critical' | 'high' | 'medium' | 'low' }) {
  const colorMap = {
    critical: { border: '#EF4444', glow: 'rgba(239,68,68,0.3)', text: '#F87171', label: 'Critical Risk' },
    high: { border: '#F97316', glow: 'rgba(249,115,22,0.3)', text: '#FB923C', label: 'High Risk' },
    medium: { border: '#EAB308', glow: 'rgba(234,179,8,0.3)', text: '#FDE047', label: 'Medium Risk' },
    low: { border: '#22C55E', glow: 'rgba(34,197,94,0.3)', text: '#4ADE80', label: 'Low Risk' },
  };
  const c = colorMap[risk];
  return (
    <div className="it-risk-gauge">
      <div className={`it-risk-score-circle it-risk-${risk}`} style={{ background: `radial-gradient(circle at 40% 40%, ${c.glow} 0%, #1A1A1A 70%)` }}>
        <span style={{ fontSize: 32, fontWeight: 800, color: c.text, lineHeight: 1 }}>{score}</span>
        <span style={{ fontSize: 10, color: '#666', marginTop: 2 }}>/ 100</span>
      </div>
      <span style={{ fontWeight: 700, color: c.text, fontSize: 14 }}>{c.label}</span>
      <span style={{ fontSize: 11, color: '#666', marginTop: 4 }}>GraphSAGE + XGBoost Ensemble</span>
    </div>
  );
}

/* ─── Main Page ─────────────────────────────────────── */
export function AlertDetailPage() {
  const { alertId } = useParams<{ alertId: string }>();
  const navigate = useNavigate();

  const { data: alert, loading, error } = useApi<AlertDetail>(`/api/alerts/${alertId}`, [alertId]);

  const [status, setStatus] = useState<string>('');
  const [savingStatus, setSavingStatus] = useState(false);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Sync local status state once alert loads
  const currentStatus = status || alert?.status || '';

  const handleStatusChange = useCallback(async (newStatus: string) => {
    setStatus(newStatus);
    setSavingStatus(true);
    setActionError(null);
    try {
      await apiPatch(`/api/alerts/${alertId}`, { status: newStatus });
      setActionMsg(`✓ Status updated to "${newStatus}"`);
      setTimeout(() => setActionMsg(null), 3000);
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Failed to update status');
    } finally {
      setSavingStatus(false);
    }
  }, [alertId]);

  function handleAction(action: string) {
    setActionMsg(`✓ ${action} initiated successfully`);
    setTimeout(() => setActionMsg(null), 3000);
  }

  if (loading) {
    return (
      <div className="it-app" style={{ background: 'var(--bg-page)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, color: 'var(--text-muted)' }}>
          <Loader size={32} style={{ animation: 'spin 1s linear infinite' }} />
          <span style={{ fontSize: 14 }}>Loading alert details…</span>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error || !alert) {
    return (
      <div className="it-app" style={{ background: 'var(--bg-page)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="it-card" style={{ maxWidth: 480, textAlign: 'center', padding: '32px' }}>
          <AlertCircle size={40} style={{ color: '#F87171', margin: '0 auto 16px' }} />
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>Alert Not Found</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>{error || `Alert ${alertId} does not exist.`}</div>
          <button className="it-btn it-btn-primary" onClick={() => navigate('/alerts')}>
            <ArrowLeft size={14} /> Back to Alerts
          </button>
        </div>
      </div>
    );
  }

  const graphElements = buildGraphElements(alert.account_id);

  return (
    <div className="it-app" style={{ background: 'var(--bg-page)', minHeight: '100vh' }}>
      <div className="it-content it-fade-in" style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>

        {/* ── Page Header ────────────────────────────────── */}
        <div className="it-page-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button onClick={() => navigate('/alerts')} className="it-btn it-btn-ghost it-btn-sm" style={{ gap: 6 }}>
              <ArrowLeft size={15} /> Back to Alerts
            </button>
            <div style={{ width: 1, height: 24, background: 'var(--border)' }} />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>Alert {alert.id}</h1>
                <RiskBadge risk={alert.risk_level} />
                <span className="it-badge it-badge-neutral" style={{ fontSize: 11 }}>
                  <span className="it-live-dot" style={{ fontSize: 10 }}>LIVE</span>
                </span>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 3 }}>{alert.type}</p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Clock size={13} style={{ color: 'var(--text-muted)' }} />
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{alert.timestamp}</span>
            </div>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 6 }}>
              <select
                className="it-input it-select"
                value={currentStatus}
                onChange={e => handleStatusChange(e.target.value)}
                disabled={savingStatus}
                style={{ width: 180, fontSize: 12, padding: '7px 32px 7px 12px', height: 36 }}
              >
                <option>Open</option>
                <option>Under Investigation</option>
                <option>Escalated to L2</option>
                <option>Pending STR</option>
                <option>Resolved</option>
                <option>False Positive</option>
              </select>
              {savingStatus && <Loader size={14} style={{ animation: 'spin 1s linear infinite', color: 'var(--text-muted)' }} />}
            </div>
          </div>
        </div>

        {/* ── Toasts ────────────────────────────────── */}
        {actionMsg && (
          <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 10, padding: '10px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, color: '#4ADE80', fontSize: 13, fontWeight: 500 }}>
            <CheckCircle size={15} /> {actionMsg}
          </div>
        )}
        {actionError && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '10px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, color: '#F87171', fontSize: 13 }}>
            <AlertCircle size={15} /> {actionError}
          </div>
        )}

        {/* ── Top 3 Info Cards ────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 24 }}>

          {/* Card 1: Risk Score */}
          <div className="it-card" style={{ background: 'linear-gradient(135deg, #1A0A0A 0%, #1A1A1A 100%)', borderColor: 'rgba(239,68,68,0.2)' }}>
            <div className="it-card-header">
              <span className="it-card-title">Risk Assessment</span>
              <ShieldAlert size={16} style={{ color: '#EF4444' }} />
            </div>
            <RiskCircle score={alert.risk_score} risk={alert.risk_level} />
          </div>

          {/* Card 2: Affected Account */}
          <div className="it-card">
            <div className="it-card-header">
              <span className="it-card-title">Affected Account</span>
              <User size={16} style={{ color: 'var(--accent)' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { label: 'Account ID', value: alert.account_id, mono: true },
                { label: 'Alert Type', value: alert.type, mono: false },
                { label: 'Total Flagged Amount', value: alert.amount_formatted, highlight: true },
                { label: 'Current Status', value: currentStatus, mono: false },
                { label: 'Flag Reason', value: alert.flag_reason?.slice(0, 60) + (alert.flag_reason?.length > 60 ? '…' : ''), mono: false },
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', flexShrink: 0 }}>{row.label}</span>
                  <span style={{ fontSize: 12, fontWeight: row.highlight ? 700 : 500, color: row.highlight ? 'var(--accent)' : 'var(--text-primary)', fontFamily: row.mono ? 'monospace' : 'inherit', maxWidth: '60%', textAlign: 'right' }}>
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Card 3: Detection Method */}
          <div className="it-card">
            <div className="it-card-header">
              <span className="it-card-title">Detection Method</span>
              <Cpu size={16} style={{ color: '#A78BFA' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#A78BFA', marginBottom: 4 }}>GraphSAGE + XGBoost</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Ensemble ML Pipeline v3.1</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { label: 'Model Confidence', value: `${alert.risk_score}%`, bar: alert.risk_score },
                  { label: 'Graph Features', value: '142 features', bar: 85 },
                  { label: 'Community Match', value: 'Syndicate-7', bar: 94 },
                ].map(item => (
                  <div key={item.label}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{item.label}</span>
                      <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)' }}>{item.value}</span>
                    </div>
                    <div className="it-progress">
                      <div className="it-progress-bar" style={{ width: `${item.bar}%`, background: '#A78BFA' }} />
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                Model Version: <span style={{ color: 'var(--text-secondary)', fontFamily: 'monospace' }}>gs-xgb-v3.1.4</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Main 2-Col Grid ─────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '60% 40%', gap: 16 }}>

          {/* ── LEFT COLUMN ────────────────────────────────── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Description & Flag Reason */}
            <div className="it-card">
              <div className="it-card-header">
                <span className="it-card-title">Alert Description</span>
                <AlertTriangle size={15} style={{ color: '#F5A623' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7, background: 'var(--bg-card-el)', borderRadius: 8, padding: '12px 14px', border: '1px solid var(--border)' }}>
                  {alert.description || 'No description available.'}
                </div>
                {alert.flag_reason && (
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Flag Reason</div>
                    <div style={{ fontSize: 12, color: '#F5A623', lineHeight: 1.6, background: 'rgba(245,166,35,0.06)', borderRadius: 8, padding: '10px 14px', border: '1px solid rgba(245,166,35,0.15)', fontFamily: 'monospace' }}>
                      {alert.flag_reason}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Timeline of Events */}
            <div className="it-card">
              <div className="it-card-header">
                <span className="it-card-title">Illustrative Event Timeline</span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Pattern reconstruction</span>
              </div>
              <div className="it-timeline">
                {TIMELINE_EVENTS.map((ev, i) => (
                  <div key={i} className="it-timeline-item">
                    <TimelineIcon type={ev.type} />
                    <div className="it-timeline-content">
                      <div className="it-timeline-time">{ev.time}</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div className="it-timeline-title">{ev.title}</div>
                        {ev.amount && (
                          <span style={{ fontSize: 12, fontWeight: 700, fontFamily: 'monospace', color: ev.amount.startsWith('+') ? '#4ADE80' : '#F87171' }}>
                            {ev.amount}
                          </span>
                        )}
                      </div>
                      <div className="it-timeline-desc">{ev.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Mini Cytoscape Graph */}
            <div className="it-card">
              <div className="it-card-header">
                <span className="it-card-title">Transaction Network Graph</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[{ color: '#EF4444', label: 'Critical' }, { color: '#F97316', label: 'High' }, { color: '#EAB308', label: 'Connected' }].map(l => (
                    <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: l.color }} />
                      <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{l.label}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ height: 280, borderRadius: 10, overflow: 'hidden', background: '#0D0D0D', border: '1px solid var(--border)' }}>
                <CytoscapeComponent
                  elements={graphElements}
                  stylesheet={CY_STYLESHEET}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  layout={{ name: 'cose', animate: true, animationDuration: 600, fit: true, padding: 30 } as any}
                  style={{ width: '100%', height: '100%' }}
                  cy={(cy) => {
                    cy.on('tap', 'node', (evt) => {
                      const nodeData = evt.target.data();
                      // Navigate to graph explorer with the tapped account pre-selected
                      navigate(`/graph?account=${encodeURIComponent(nodeData.label || nodeData.id)}`);
                    });
                  }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>6 nodes · 5 edges · Tap a node to explore</span>
                <button className="it-btn it-btn-ghost it-btn-sm" style={{ fontSize: 11 }} onClick={() => navigate(`/graph?account=${encodeURIComponent(alert.account_id)}`)}>
                  Open in Graph Explorer →
                </button>
              </div>
            </div>
          </div>

          {/* ── RIGHT COLUMN ───────────────────────────────── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* AI Investigation Summary */}
            <div className="it-card" style={{ borderColor: 'rgba(245,166,35,0.2)' }}>
              <div className="it-card-header">
                <span className="it-card-title">AI Investigation Summary</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Zap size={13} style={{ color: 'var(--accent)' }} />
                  <span style={{ fontSize: 11, color: 'var(--accent)' }}>GraphSAGE Analysis</span>
                </div>
              </div>
              <div style={{ background: '#0A0A0A', borderRadius: 10, padding: 16, border: '1px solid rgba(245,166,35,0.15)', fontFamily: "'Courier New', monospace" }}>
                <div style={{ fontSize: 10, color: '#666', marginBottom: 10, letterSpacing: '0.05em' }}>
                  {'>'} INTELLITRACE AI ENGINE v3.1 — ANALYSIS REPORT
                </div>
                <p style={{ fontSize: 12, color: '#F5A623', lineHeight: 1.8, marginBottom: 12 }}>
                  Account <span style={{ color: '#FDE68A' }}>{alert.account_id}</span> flagged with risk score{' '}
                  <span style={{ color: '#FBBF24' }}>{alert.risk_score}/100</span> ({alert.risk_level.toUpperCase()} severity).{' '}
                  Total flagged amount: <span style={{ color: '#FDE68A' }}>{alert.amount_formatted}</span>.
                </p>
                <p style={{ fontSize: 12, color: '#D97706', lineHeight: 1.8, marginBottom: 12 }}>
                  {alert.description}
                </p>
                <p style={{ fontSize: 12, color: '#92400E', lineHeight: 1.8 }}>
                  Flag reason: {alert.flag_reason || 'Automated detection trigger'}
                </p>
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(245,166,35,0.15)' }}>
                  <span style={{ fontSize: 10, color: '#666' }}>
                    Generated: {alert.timestamp} · Risk Score: {alert.risk_score} · Model: gs-xgb-v3.1.4
                  </span>
                </div>
              </div>
            </div>

            {/* Related Entity Link */}
            <div className="it-card">
              <div className="it-card-header">
                <span className="it-card-title">Flagged Entity</span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Primary account</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-card-el)', borderRadius: 8, padding: '12px 14px', border: '1px solid var(--border)' }}>
                  <div>
                    <div style={{ fontSize: 12, fontFamily: 'monospace', color: 'var(--accent)', fontWeight: 600 }}>{alert.account_id}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{alert.type}</div>
                  </div>
                  <Link
                    to={`/entity/${alert.account_id}`}
                    style={{ fontSize: 12, color: 'var(--accent)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}
                  >
                    View Profile →
                  </Link>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="it-card">
              <div className="it-card-header">
                <span className="it-card-title">Investigation Actions</span>
                <TrendingUp size={15} style={{ color: 'var(--accent)' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button className="it-btn it-btn-primary" style={{ justifyContent: 'center', width: '100%' }} onClick={() => handleAction('Open Case')}>
                  <Folder size={15} /> Open Investigation Case
                </button>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <button className="it-btn it-btn-outline" style={{ justifyContent: 'center' }} onClick={() => handleAction('STR Generated')}>
                    <FileText size={14} /> Generate STR
                  </button>
                  <button className="it-btn it-btn-outline" style={{ justifyContent: 'center' }} onClick={() => handleAction('Escalated to FIU')}>
                    <Send size={14} /> Escalate to FIU
                  </button>
                </div>
                <button
                  className="it-btn it-btn-ghost"
                  style={{ justifyContent: 'center', width: '100%', border: '1px dashed var(--border)' }}
                  onClick={() => handleStatusChange('False Positive')}
                >
                  <XCircle size={14} style={{ color: '#F87171' }} />
                  <span style={{ color: '#F87171' }}>Mark as False Positive</span>
                </button>
              </div>

              {/* Quick Stats */}
              <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                {[
                  { label: 'Alert ID', value: alert.id },
                  { label: 'Risk Score', value: `${alert.risk_score}/100` },
                  { label: 'Priority', value: alert.risk_level === 'critical' ? 'P1 Critical' : alert.risk_level === 'high' ? 'P2 High' : 'P3 Medium' },
                ].map(s => (
                  <div key={s.label} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)', wordBreak: 'break-all' }}>{s.value}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
