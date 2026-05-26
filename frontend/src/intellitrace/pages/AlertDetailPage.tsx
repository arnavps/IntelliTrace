import { useState } from 'react';
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
} from 'lucide-react';
import '../styles/dashboard.css';

/* ─── Types ─────────────────────────────────────────── */
interface TimelineEvent {
  time: string;
  title: string;
  desc: string;
  amount?: string;
  type: 'deposit' | 'transfer' | 'swift' | 'split' | 'withdrawal' | 'alert';
}

interface RelatedAccount {
  id: string;
  name: string;
  bank: string;
  riskScore: number;
  relationship: string;
}

interface FraudIndicator {
  pattern: string;
  severity: 'critical' | 'high' | 'medium';
  confidence: number;
}

/* ─── Mock Data ─────────────────────────────────────── */
const ALERT_MOCK: Record<string, {
  id: string;
  title: string;
  risk: 'critical' | 'high' | 'medium' | 'low';
  score: number;
  timestamp: string;
  accountId: string;
  kycName: string;
  accountType: string;
  bank: string;
  flaggedAmount: string;
  status: string;
}> = {
  default: {
    id: 'ALT-4821',
    title: 'Rapid Layering — Shell Corp Routing',
    risk: 'critical',
    score: 94,
    timestamp: '2026-05-26 10:15:32 IST',
    accountId: 'ACC-4821',
    kycName: 'Rakesh Mehta Enterprises',
    accountType: 'Current Account',
    bank: 'HDFC Bank — Mumbai Branch',
    flaggedAmount: '₹50,23,400',
    status: 'Under Investigation',
  },
};

const TIMELINE_EVENTS: TimelineEvent[] = [
  { time: '10:00 AM', title: 'Large Deposit Received', desc: 'Deposit of ₹5,00,000 from ACC-3301 (flagged sender)', amount: '+₹5,00,000', type: 'deposit' },
  { time: '10:02 AM', title: 'Rapid Transfer to Shell Corp', desc: 'Immediate transfer of ₹4,80,000 to Shell Corp Alpha Pvt Ltd', amount: '-₹4,80,000', type: 'transfer' },
  { time: '10:05 AM', title: 'SWIFT to Offshore Bank', desc: 'International wire transfer routed via Mauritius SWIFT corridor', amount: '-₹3,20,000', type: 'swift' },
  { time: '10:08 AM', title: 'Smurfing: Split Across 5 Accounts', desc: 'Funds split into 5 sub-threshold transactions (₹90K each)', amount: '-₹4,50,000', type: 'split' },
  { time: '10:11 AM', title: 'ATM Withdrawal Cluster', desc: 'Cash withdrawal of ₹4,50,000 via 3 ATMs within 2km radius', amount: '-₹4,50,000', type: 'withdrawal' },
  { time: '10:15 AM', title: 'Alert Triggered by GraphSAGE', desc: 'System detected syndicate pattern — alert escalated to L2', amount: undefined, type: 'alert' },
];

const FRAUD_INDICATORS: FraudIndicator[] = [
  { pattern: 'Rapid Layering (Funds cycled < 15 min)', severity: 'critical', confidence: 97 },
  { pattern: 'Smurfing (Sub-threshold splitting across 5 accounts)', severity: 'critical', confidence: 94 },
  { pattern: 'Shell Company Routing (Known flagged entity)', severity: 'high', confidence: 91 },
  { pattern: 'Offshore SWIFT Corridor (High-risk jurisdiction)', severity: 'high', confidence: 88 },
  { pattern: 'ATM Cluster Withdrawal (Geographic proximity)', severity: 'medium', confidence: 76 },
  { pattern: 'Velocity Anomaly (40x normal transaction rate)', severity: 'high', confidence: 93 },
];

const RELATED_ACCOUNTS: RelatedAccount[] = [
  { id: 'ACC-3301', name: 'Priya Holdings LLC', bank: 'ICICI Bank', riskScore: 87, relationship: 'Source' },
  { id: 'ACC-7712', name: 'Shell Corp Alpha Pvt Ltd', bank: 'Axis Bank', riskScore: 96, relationship: 'Intermediary' },
  { id: 'ACC-0091', name: 'Offshore Trust — Mauritius', bank: 'MCB Bank', riskScore: 99, relationship: 'Destination' },
  { id: 'ACC-5503', name: 'Arjun Kapoor (Personal)', bank: 'SBI', riskScore: 71, relationship: 'Connected' },
  { id: 'ACC-2240', name: 'Nexus Trade Pvt Ltd', bank: 'Kotak Bank', riskScore: 82, relationship: 'Connected' },
];

/* ─── Cytoscape Graph Elements ──────────────────────── */
const buildGraphElements = (alertId: string): ElementDefinition[] => [
  { data: { id: 'acc_main', label: `ACC-${alertId.replace(/\D/g, '') || '4821'}`, type: 'main', risk: 94 } },
  { data: { id: 'acc_src1', label: 'ACC-3301', type: 'source', risk: 87 } },
  { data: { id: 'acc_shell', label: 'Shell Corp α', type: 'shell', risk: 96 } },
  { data: { id: 'acc_offshore', label: 'Offshore Bank', type: 'offshore', risk: 99 } },
  { data: { id: 'acc_k1', label: 'ACC-5503', type: 'connected', risk: 71 } },
  { data: { id: 'acc_k2', label: 'ACC-2240', type: 'connected', risk: 82 } },
  { data: { id: 'e1', source: 'acc_src1', target: 'acc_main', label: '₹5L', type: 'deposit' } },
  { data: { id: 'e2', source: 'acc_main', target: 'acc_shell', label: '₹4.8L', type: 'transfer' } },
  { data: { id: 'e3', source: 'acc_shell', target: 'acc_offshore', label: 'SWIFT', type: 'swift' } },
  { data: { id: 'e4', source: 'acc_main', target: 'acc_k1', label: '₹90K', type: 'split' } },
  { data: { id: 'e5', source: 'acc_main', target: 'acc_k2', label: '₹90K', type: 'split' } },
];

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
  {
    selector: 'node[type="main"]',
    style: {
      'background-color': '#1A0A0A',
      'border-color': '#EF4444',
      'border-width': 4,
      'width': 56,
      'height': 56,
    },
  },
  {
    selector: 'node[type="source"]',
    style: { 'border-color': '#F97316' },
  },
  {
    selector: 'node[type="shell"]',
    style: { 'border-color': '#EF4444', 'background-color': '#1A0A0A' },
  },
  {
    selector: 'node[type="offshore"]',
    style: { 'border-color': '#DC2626', 'background-color': '#1A0505' },
  },
  {
    selector: 'node[type="connected"]',
    style: { 'border-color': '#EAB308' },
  },
  {
    selector: 'edge',
    style: {
      'width': 2,
      'line-color': '#2A2A2A',
      'target-arrow-color': '#2A2A2A',
      'target-arrow-shape': 'triangle' as const,
      'curve-style': 'bezier' as const,
      'font-size': 9,
      'color': '#999',
      'label': 'data(label)',
      'text-background-color': '#1A1A1A',
      'text-background-opacity': 1,
      'text-background-padding': '2px',
    },
  },
  {
    selector: 'edge[type="transfer"], edge[type="swift"]',
    style: { 'line-color': '#EF4444', 'target-arrow-color': '#EF4444' },
  },
  {
    selector: 'edge[type="deposit"]',
    style: { 'line-color': '#F97316', 'target-arrow-color': '#F97316' },
  },
  {
    selector: 'edge[type="split"]',
    style: { 'line-color': '#EAB308', 'target-arrow-color': '#EAB308' },
  },
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
  return (
    <div
      className="it-timeline-dot"
      style={{ color, borderColor: border, boxShadow: `0 0 10px ${border}` }}
    >
      {icon}
    </div>
  );
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
      <div
        className={`it-risk-score-circle it-risk-${risk}`}
        style={{
          background: `radial-gradient(circle at 40% 40%, ${c.glow} 0%, #1A1A1A 70%)`,
        }}
      >
        <span style={{ fontSize: 32, fontWeight: 800, color: c.text, lineHeight: 1 }}>{score}</span>
        <span style={{ fontSize: 10, color: '#666', marginTop: 2 }}>/ 100</span>
      </div>
      <span style={{ fontWeight: 700, color: c.text, fontSize: 14 }}>{c.label}</span>
      <span style={{ fontSize: 11, color: '#666', marginTop: 4 }}>GraphSAGE Confidence: 97%</span>
    </div>
  );
}

/* ─── Main Page ─────────────────────────────────────── */
export function AlertDetailPage() {
  const { alertId } = useParams<{ alertId: string }>();
  const navigate = useNavigate();

  const alert = ALERT_MOCK['default'];
  const displayId = alertId || alert.id;
  const graphElements = buildGraphElements(displayId);

  const [status, setStatus] = useState(alert.status);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  function handleAction(action: string) {
    setActionMsg(`✓ ${action} initiated successfully`);
    setTimeout(() => setActionMsg(null), 3000);
  }

  return (
    <div className="it-app" style={{ background: 'var(--bg-page)', minHeight: '100vh' }}>
      <div className="it-content it-fade-in" style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>

        {/* ── Page Header ────────────────────────────────── */}
        <div className="it-page-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button
              onClick={() => navigate('/alerts')}
              className="it-btn it-btn-ghost it-btn-sm"
              style={{ gap: 6 }}
            >
              <ArrowLeft size={15} /> Back to Alerts
            </button>
            <div style={{ width: 1, height: 24, background: 'var(--border)' }} />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>
                  Alert {displayId}
                </h1>
                <RiskBadge risk={alert.risk} />
                <span className="it-badge it-badge-neutral" style={{ fontSize: 11 }}>
                  <span className="it-live-dot" style={{ fontSize: 10 }}>LIVE</span>
                </span>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 3 }}>
                {alert.title}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Clock size={13} style={{ color: 'var(--text-muted)' }} />
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{alert.timestamp}</span>
            </div>
            <div style={{ position: 'relative' }}>
              <select
                className="it-input it-select"
                value={status}
                onChange={e => setStatus(e.target.value)}
                style={{ width: 180, fontSize: 12, padding: '7px 32px 7px 12px', height: 36 }}
              >
                <option>Under Investigation</option>
                <option>Escalated to L2</option>
                <option>Pending STR</option>
                <option>Resolved</option>
                <option>False Positive</option>
              </select>
            </div>
          </div>
        </div>

        {/* ── Action Toast ────────────────────────────────── */}
        {actionMsg && (
          <div style={{
            background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)',
            borderRadius: 10, padding: '10px 16px', marginBottom: 16,
            display: 'flex', alignItems: 'center', gap: 8,
            color: '#4ADE80', fontSize: 13, fontWeight: 500,
          }}>
            <CheckCircle size={15} /> {actionMsg}
          </div>
        )}

        {/* ── Top 3 Info Cards ────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 24 }}>

          {/* Card 1: Risk Score */}
          <div className="it-card" style={{
            background: 'linear-gradient(135deg, #1A0A0A 0%, #1A1A1A 100%)',
            borderColor: 'rgba(239,68,68,0.2)',
          }}>
            <div className="it-card-header">
              <span className="it-card-title">Risk Assessment</span>
              <ShieldAlert size={16} style={{ color: '#EF4444' }} />
            </div>
            <RiskCircle score={alert.score} risk={alert.risk} />
          </div>

          {/* Card 2: Affected Account */}
          <div className="it-card">
            <div className="it-card-header">
              <span className="it-card-title">Affected Account</span>
              <User size={16} style={{ color: 'var(--accent)' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { label: 'Account ID', value: alert.accountId, mono: true },
                { label: 'KYC Name', value: alert.kycName, mono: false },
                { label: 'Account Type', value: alert.accountType, mono: false },
                { label: 'Bank', value: alert.bank, mono: false },
                { label: 'Total Flagged Amount', value: alert.flaggedAmount, highlight: true },
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {row.label}
                  </span>
                  <span style={{
                    fontSize: 12,
                    fontWeight: row.highlight ? 700 : 500,
                    color: row.highlight ? 'var(--accent)' : 'var(--text-primary)',
                    fontFamily: row.mono ? 'monospace' : 'inherit',
                    maxWidth: '60%', textAlign: 'right',
                  }}>
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
              <div style={{
                background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)',
                borderRadius: 10, padding: '12px 14px',
              }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#A78BFA', marginBottom: 4 }}>
                  GraphSAGE + XGBoost
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Ensemble ML Pipeline v3.1</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { label: 'Model Confidence', value: '97.3%', bar: 97 },
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

            {/* Timeline of Events */}
            <div className="it-card">
              <div className="it-card-header">
                <span className="it-card-title">Timeline of Events</span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>May 26, 2026</span>
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
                          <span style={{
                            fontSize: 12, fontWeight: 700, fontFamily: 'monospace',
                            color: ev.amount.startsWith('+') ? '#4ADE80' : '#F87171',
                          }}>
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

            {/* Fraud Indicators */}
            <div className="it-card">
              <div className="it-card-header">
                <span className="it-card-title">Fraud Indicators</span>
                <span className="it-badge it-badge-critical">
                  {FRAUD_INDICATORS.filter(f => f.severity === 'critical').length} Critical
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {FRAUD_INDICATORS.map((indicator, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    background: 'var(--bg-card-el)', borderRadius: 8, padding: '10px 14px',
                    border: '1px solid var(--border)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <AlertTriangle size={14} style={{
                        color: indicator.severity === 'critical' ? '#F87171'
                          : indicator.severity === 'high' ? '#FB923C' : '#FDE047',
                        flexShrink: 0,
                      }} />
                      <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>{indicator.pattern}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{indicator.confidence}%</span>
                      <span className={`it-badge it-badge-${indicator.severity}`}>{indicator.severity}</span>
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
                  {[
                    { color: '#EF4444', label: 'Critical' },
                    { color: '#F97316', label: 'High' },
                    { color: '#EAB308', label: 'Connected' },
                  ].map(l => (
                    <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: l.color }} />
                      <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{l.label}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{
                height: 280, borderRadius: 10, overflow: 'hidden',
                background: '#0D0D0D', border: '1px solid var(--border)',
              }}>
                <CytoscapeComponent
                  elements={graphElements}
                  stylesheet={CY_STYLESHEET}
                  layout={{ name: 'cose', padding: 30, animate: false } as any}
                  style={{ width: '100%', height: '100%' }}
                  cy={(cy) => {
                    cy.on('tap', 'node', (evt) => {
                      const nodeId = evt.target.data('id');
                      console.log('Node tapped:', nodeId);
                    });
                  }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>6 nodes · 5 edges · Syndicate-7 community</span>
                <button className="it-btn it-btn-ghost it-btn-sm" style={{ fontSize: 11 }}>
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
              <div style={{
                background: '#0A0A0A', borderRadius: 10, padding: 16,
                border: '1px solid rgba(245,166,35,0.15)',
                fontFamily: "'Courier New', monospace",
              }}>
                <div style={{ fontSize: 10, color: '#666', marginBottom: 10, letterSpacing: '0.05em' }}>
                  {'>'} INTELLITRACE AI ENGINE v3.1 — ANALYSIS REPORT
                </div>
                <p style={{ fontSize: 12, color: '#F5A623', lineHeight: 1.8, marginBottom: 12 }}>
                  Account <span style={{ color: '#FDE68A' }}>ACC-{displayId.replace(/\D/g, '') || '4821'}</span> exhibited{' '}
                  <span style={{ color: '#FBBF24' }}>rapid layering behavior</span>. After receiving{' '}
                  <span style={{ color: '#FDE68A' }}>₹50L</span> from 3 source accounts within{' '}
                  <span style={{ color: '#FBBF24' }}>8 minutes</span>, 94.7% of funds were routed through{' '}
                  <span style={{ color: '#FCA5A5' }}>Shell Corp Alpha</span> to an offshore jurisdiction.
                </p>
                <p style={{ fontSize: 12, color: '#D97706', lineHeight: 1.8, marginBottom: 12 }}>
                  GraphSAGE community analysis confirms this account belongs to a{' '}
                  <span style={{ color: '#FBBF24' }}>syndicate of 7 connected entities</span>{' '}
                  with a combined exposure of ₹3.2Cr. Louvain modularity score: 0.847.
                </p>
                <p style={{ fontSize: 12, color: '#92400E', lineHeight: 1.8 }}>
                  XGBoost flags: velocity_anomaly=TRUE, smurfing_pattern=TRUE,{' '}
                  offshore_corridor=MAURITIUS, sar_threshold=EXCEEDED.
                </p>
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(245,166,35,0.15)' }}>
                  <span style={{ fontSize: 10, color: '#666' }}>
                    Generated: 2026-05-26 10:15:34 UTC · Confidence: 97.3% · Model: gs-xgb-v3.1.4
                  </span>
                </div>
              </div>
            </div>

            {/* Related Accounts */}
            <div className="it-card">
              <div className="it-card-header">
                <span className="it-card-title">Related Accounts</span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Syndicate-7</span>
              </div>
              <div className="it-table-wrap">
                <table className="it-table">
                  <thead>
                    <tr>
                      <th>Account</th>
                      <th>Bank</th>
                      <th>Role</th>
                      <th>Risk</th>
                    </tr>
                  </thead>
                  <tbody>
                    {RELATED_ACCOUNTS.map(acc => (
                      <tr key={acc.id} style={{ cursor: 'pointer' }}>
                        <td>
                          <Link
                            to={`/entity/${acc.id}`}
                            style={{ color: 'var(--accent)', textDecoration: 'none', fontFamily: 'monospace', fontSize: 12 }}
                          >
                            {acc.id}
                          </Link>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{acc.name}</div>
                        </td>
                        <td style={{ fontSize: 12 }}>{acc.bank}</td>
                        <td>
                          <span style={{
                            fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
                            background: acc.relationship === 'Source' ? 'rgba(249,115,22,0.15)'
                              : acc.relationship === 'Destination' ? 'rgba(239,68,68,0.15)'
                              : acc.relationship === 'Intermediary' ? 'rgba(139,92,246,0.15)'
                              : 'rgba(255,255,255,0.06)',
                            color: acc.relationship === 'Source' ? '#FB923C'
                              : acc.relationship === 'Destination' ? '#F87171'
                              : acc.relationship === 'Intermediary' ? '#A78BFA'
                              : '#999',
                          }}>
                            {acc.relationship}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{
                              fontSize: 12, fontWeight: 700,
                              color: acc.riskScore >= 90 ? '#F87171' : acc.riskScore >= 80 ? '#FB923C' : '#FDE047',
                            }}>
                              {acc.riskScore}
                            </span>
                            <div className="it-progress" style={{ width: 40, height: 4 }}>
                              <div
                                className="it-progress-bar"
                                style={{
                                  width: `${acc.riskScore}%`,
                                  background: acc.riskScore >= 90 ? '#EF4444' : acc.riskScore >= 80 ? '#F97316' : '#EAB308',
                                }}
                              />
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Actions */}
            <div className="it-card">
              <div className="it-card-header">
                <span className="it-card-title">Investigation Actions</span>
                <TrendingUp size={15} style={{ color: 'var(--accent)' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button
                  className="it-btn it-btn-primary"
                  style={{ justifyContent: 'center', width: '100%' }}
                  onClick={() => handleAction('Open Case')}
                >
                  <Folder size={15} /> Open Investigation Case
                </button>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <button
                    className="it-btn it-btn-outline"
                    style={{ justifyContent: 'center' }}
                    onClick={() => handleAction('STR Generated')}
                  >
                    <FileText size={14} /> Generate STR
                  </button>
                  <button
                    className="it-btn it-btn-outline"
                    style={{ justifyContent: 'center' }}
                    onClick={() => handleAction('Escalated to FIU')}
                  >
                    <Send size={14} /> Escalate to FIU
                  </button>
                </div>
                <button
                  className="it-btn it-btn-ghost"
                  style={{ justifyContent: 'center', width: '100%', border: '1px dashed var(--border)' }}
                  onClick={() => handleAction('Marked as False Positive')}
                >
                  <XCircle size={14} style={{ color: '#F87171' }} />
                  <span style={{ color: '#F87171' }}>Mark as False Positive</span>
                </button>
              </div>

              {/* Quick Stats */}
              <div style={{
                marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)',
                display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10,
              }}>
                {[
                  { label: 'Alert Age', value: '2h 14m' },
                  { label: 'SLA Remaining', value: '21h 46m' },
                  { label: 'Priority', value: 'P1 Critical' },
                ].map(s => (
                  <div key={s.label} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{s.value}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
