import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import CytoscapeComponent from 'react-cytoscapejs';
import {
  ArrowLeft,
  User,
  AlertTriangle,
  ShieldAlert,
  CreditCard,
  Calendar,
  Activity,
  Wifi,
  Monitor,
  Smartphone,
  Globe,
  ChevronRight,
  Clock,
  TrendingUp,
  TrendingDown,
  ExternalLink,
  MapPin,
  Flag,
} from 'lucide-react';
import '../styles/dashboard.css';

// ─── Mock Data ─────────────────────────────────────────────────────────────────

const ENTITY = {
  id: 'ACC-7711',
  name: 'Rajan Mehta',
  initials: 'RM',
  accountType: 'Current Account',
  bank: 'State Bank of India',
  status: 'Flagged',
  riskScore: 94,
  riskPercentile: 'Top 2% Risk',
  fraudAlerts: 7,
  caseCount: 3,
  pan: 'ABCDE1234F',
  aadhaar: '****-****-5678',
  dob: '15 Mar 1985',
  kycStatus: 'Complete',
  openingDate: '12 Jan 2019',
  kycDate: '14 Jan 2019',
  balance: '₹2,34,780',
  flaggedSince: '03 Feb 2025',
};

const TRANSACTIONS = [
  { id: 'TXN-0091', date: '2025-05-24 09:12', type: 'Credit', amount: '₹4,50,000', counterparty: 'Zenith Exports Ltd', channel: 'NEFT', status: 'Flagged', risk: 'critical' },
  { id: 'TXN-0087', date: '2025-05-22 14:33', type: 'Debit', amount: '₹1,20,000', counterparty: 'Anil Kumar (ACC-3312)', channel: 'IMPS', status: 'Flagged', risk: 'high' },
  { id: 'TXN-0081', date: '2025-05-21 11:05', type: 'Debit', amount: '₹98,500', counterparty: 'ShellTech Pvt Ltd', channel: 'RTGS', status: 'Suspicious', risk: 'high' },
  { id: 'TXN-0075', date: '2025-05-19 16:20', type: 'Credit', amount: '₹2,10,000', counterparty: 'Priya Nair (ACC-5521)', channel: 'UPI', status: 'Clear', risk: 'low' },
  { id: 'TXN-0068', date: '2025-05-18 10:44', type: 'Debit', amount: '₹75,000', counterparty: 'Global Trade Co', channel: 'NEFT', status: 'Suspicious', risk: 'medium' },
  { id: 'TXN-0062', date: '2025-05-17 08:30', type: 'Credit', amount: '₹3,80,000', counterparty: 'Mehta Holdings LLP', channel: 'RTGS', status: 'Flagged', risk: 'critical' },
  { id: 'TXN-0055', date: '2025-05-15 13:15', type: 'Debit', amount: '₹45,000', counterparty: 'Cashout ATM #4412', channel: 'ATM', status: 'Clear', risk: 'low' },
  { id: 'TXN-0049', date: '2025-05-13 09:55', type: 'Credit', amount: '₹1,95,000', counterparty: 'Vikram Shah (ACC-9021)', channel: 'IMPS', status: 'Suspicious', risk: 'medium' },
  { id: 'TXN-0044', date: '2025-05-11 15:40', type: 'Debit', amount: '₹2,25,000', counterparty: 'Offshore Trade Ltd', channel: 'SWIFT', status: 'Flagged', risk: 'critical' },
  { id: 'TXN-0039', date: '2025-05-09 11:22', type: 'Debit', amount: '₹60,000', counterparty: 'Layered Logistics', channel: 'NEFT', status: 'Suspicious', risk: 'high' },
  { id: 'TXN-0031', date: '2025-05-07 14:10', type: 'Credit', amount: '₹88,000', counterparty: 'Rohan Desai (ACC-1142)', channel: 'UPI', status: 'Clear', risk: 'low' },
  { id: 'TXN-0026', date: '2025-05-05 09:30', type: 'Debit', amount: '₹1,50,000', counterparty: 'Capital Gateway Pvt', channel: 'RTGS', status: 'Flagged', risk: 'high' },
  { id: 'TXN-0020', date: '2025-05-03 16:55', type: 'Credit', amount: '₹5,00,000', counterparty: 'Unknown Beneficiary', channel: 'NEFT', status: 'Flagged', risk: 'critical' },
  { id: 'TXN-0014', date: '2025-05-01 10:12', type: 'Debit', amount: '₹33,000', counterparty: 'Retail Shop #2241', channel: 'POS', status: 'Clear', risk: 'low' },
  { id: 'TXN-0008', date: '2025-04-29 08:45', type: 'Debit', amount: '₹4,10,000', counterparty: 'BVI Holdings Corp', channel: 'SWIFT', status: 'Flagged', risk: 'critical' },
];

const ALERTS = [
  { id: 'ALT-0044', type: 'Rapid Layering', severity: 'critical', date: '24 May 2025', desc: '4 transactions in 6 minutes totalling ₹8.5L' },
  { id: 'ALT-0039', type: 'High Value SWIFT', severity: 'high', date: '11 May 2025', desc: 'SWIFT transfer ₹2.25L to Offshore Trade Ltd' },
  { id: 'ALT-0031', type: 'Smurfing Pattern', severity: 'high', date: '05 May 2025', desc: '3 transactions just below ₹2L threshold' },
];

const LINKED_ENTITIES = [
  { id: 'ACC-3312', name: 'Anil Kumar', rel: 'Frequent Recipient', risk: 'high', txnCount: 12 },
  { id: 'ENT-Zenith', name: 'Zenith Exports Ltd', rel: 'Corporate Sender', risk: 'critical', txnCount: 4 },
  { id: 'ACC-5521', name: 'Priya Nair', rel: 'Occasional Sender', risk: 'medium', txnCount: 6 },
  { id: 'ENT-Mehta', name: 'Mehta Holdings LLP', rel: 'Associated Entity', risk: 'critical', txnCount: 8 },
  { id: 'ACC-9021', name: 'Vikram Shah', rel: 'Peer Transfer', risk: 'medium', txnCount: 3 },
];

const TIMELINE_EVENTS = [
  { time: '24 May 2025', title: 'Account Flagged - Rapid Layering', type: 'critical' },
  { time: '11 May 2025', title: 'SWIFT Transfer Flagged', type: 'high' },
  { time: '03 Feb 2025', title: 'First Suspicious Activity Detected', type: 'high' },
  { time: '15 Jan 2025', title: 'KYC Re-verification Pending', type: 'medium' },
  { time: '12 Jan 2019', title: 'Account Opened', type: 'info' },
];

const DEVICES = [
  { type: 'Mobile', id: 'DEV-A1B2C3', os: 'Android 13', firstSeen: '15 Jan 2024', lastSeen: '24 May 2025', location: 'Mumbai, MH', suspicious: false },
  { type: 'Desktop', id: 'DEV-D4E5F6', os: 'Windows 11', firstSeen: '12 Mar 2024', lastSeen: '20 May 2025', location: 'Delhi, DL', suspicious: false },
  { type: 'Mobile', id: 'DEV-G7H8I9', os: 'iOS 17', firstSeen: '01 Apr 2025', lastSeen: '24 May 2025', location: 'Unknown', suspicious: true },
  { type: 'Tablet', id: 'DEV-J0K1L2', os: 'Android 12', firstSeen: '22 Feb 2025', lastSeen: '10 May 2025', location: 'Pune, MH', suspicious: false },
  { type: 'Desktop', id: 'DEV-M3N4O5', os: 'macOS 14', firstSeen: '03 May 2025', lastSeen: '18 May 2025', location: 'Singapore', suspicious: true },
];

const IP_ADDRESSES = [
  { ip: '103.45.112.78', isp: 'Jio Platforms', country: 'India', firstSeen: '15 Jan 2024', lastSeen: '24 May 2025', vpn: false },
  { ip: '45.33.110.22', isp: 'Airtel Broadband', country: 'India', firstSeen: '12 Mar 2024', lastSeen: '19 May 2025', vpn: false },
  { ip: '185.220.101.45', isp: 'ProtonVPN', country: 'Switzerland', firstSeen: '01 Apr 2025', lastSeen: '24 May 2025', vpn: true },
  { ip: '178.62.45.90', isp: 'DigitalOcean LLC', country: 'Netherlands', firstSeen: '22 Apr 2025', lastSeen: '22 May 2025', vpn: true },
  { ip: '49.36.78.120', isp: 'Vodafone Idea', country: 'India', firstSeen: '10 Jan 2025', lastSeen: '15 May 2025', vpn: false },
  { ip: '103.88.45.67', isp: 'BSNL', country: 'India', firstSeen: '20 Mar 2025', lastSeen: '14 May 2025', vpn: false },
  { ip: '92.112.84.34', isp: 'Mullvad VPN', country: 'Sweden', firstSeen: '03 May 2025', lastSeen: '18 May 2025', vpn: true },
  { ip: '172.67.215.93', isp: 'Cloudflare Inc', country: 'United States', firstSeen: '12 May 2025', lastSeen: '24 May 2025', vpn: false },
];

// ─── Cytoscape Graph Elements ──────────────────────────────────────────────────

const GRAPH_ELEMENTS = [
  // Central node
  { data: { id: 'rm', label: 'Rajan Mehta\nACC-7711', type: 'main', risk: 'critical' } },
  // Connected nodes
  { data: { id: 'anil', label: 'Anil Kumar\nACC-3312', type: 'account', risk: 'high' } },
  { data: { id: 'zenith', label: 'Zenith\nExports', type: 'entity', risk: 'critical' } },
  { data: { id: 'priya', label: 'Priya Nair\nACC-5521', type: 'account', risk: 'medium' } },
  { data: { id: 'mehta', label: 'Mehta\nHoldings', type: 'entity', risk: 'critical' } },
  { data: { id: 'vikram', label: 'Vikram Shah\nACC-9021', type: 'account', risk: 'medium' } },
  { data: { id: 'offshore', label: 'Offshore\nTrade Ltd', type: 'entity', risk: 'critical' } },
  { data: { id: 'bvi', label: 'BVI Holdings\nCorp', type: 'entity', risk: 'critical' } },
  // Edges
  { data: { id: 'e1', source: 'rm', target: 'anil', label: '₹1.2L' } },
  { data: { id: 'e2', source: 'zenith', target: 'rm', label: '₹4.5L' } },
  { data: { id: 'e3', source: 'priya', target: 'rm', label: '₹2.1L' } },
  { data: { id: 'e4', source: 'rm', target: 'mehta', label: '₹3.8L' } },
  { data: { id: 'e5', source: 'vikram', target: 'rm', label: '₹1.95L' } },
  { data: { id: 'e6', source: 'rm', target: 'offshore', label: '₹2.25L' } },
  { data: { id: 'e7', source: 'rm', target: 'bvi', label: '₹4.1L' } },
  { data: { id: 'e8', source: 'anil', target: 'zenith', label: '₹80K' } },
];

const CYTOSCAPE_STYLESHEET: any = [
  {
    selector: 'node',
    style: {
      'background-color': '#222222',
      'border-width': 2,
      'border-color': '#2A2A2A',
      'color': '#ffffff',
      'label': 'data(label)',
      'text-valign': 'center',
      'text-halign': 'center',
      'font-size': '10px',
      'font-family': 'Inter, sans-serif',
      'text-wrap': 'wrap',
      'text-max-width': '80px',
      'width': 70,
      'height': 70,
      'shape': 'ellipse',
    },
  },
  {
    selector: 'node[type="main"]',
    style: {
      'background-color': '#2a1a00',
      'border-color': '#F5A623',
      'border-width': 3,
      'width': 90,
      'height': 90,
      'font-size': '11px',
      'font-weight': '700',
      'box-shadow': '0 0 20px rgba(245,166,35,0.5)',
    },
  },
  {
    selector: 'node[risk="critical"]',
    style: {
      'border-color': '#EF4444',
      'background-color': '#200a0a',
    },
  },
  {
    selector: 'node[type="main"]',
    style: {
      'border-color': '#F5A623',
      'background-color': '#2a1800',
    },
  },
  {
    selector: 'node[risk="high"]',
    style: {
      'border-color': '#F97316',
      'background-color': '#1a0e00',
    },
  },
  {
    selector: 'node[risk="medium"]',
    style: {
      'border-color': '#EAB308',
      'background-color': '#1a1600',
    },
  },
  {
    selector: 'edge',
    style: {
      'width': 1.5,
      'line-color': '#2A2A2A',
      'target-arrow-color': '#2A2A2A',
      'target-arrow-shape': 'triangle',
      'curve-style': 'bezier',
      'label': 'data(label)',
      'font-size': '9px',
      'color': '#999999',
      'font-family': 'Inter, sans-serif',
      'text-background-color': '#0A0A0A',
      'text-background-opacity': 1,
      'text-background-padding': '2px',
    },
  },
];

// ─── Helpers ───────────────────────────────────────────────────────────────────

function riskBadge(risk: string) {
  const map: Record<string, string> = {
    critical: 'it-badge it-badge-critical',
    high: 'it-badge it-badge-high',
    medium: 'it-badge it-badge-medium',
    low: 'it-badge it-badge-low',
    info: 'it-badge it-badge-info',
  };
  return map[risk] ?? 'it-badge it-badge-neutral';
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function EntityProfilePage() {
  const { entityId } = useParams<{ entityId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'network' | 'devices'>('overview');

  const displayId = entityId || ENTITY.id;

  return (
    <div className="it-app" style={{ background: 'var(--bg-page)', minHeight: '100vh', padding: '24px' }}>
      {/* ─── Header ─── */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <button
            onClick={() => navigate(-1)}
            className="it-btn it-btn-outline it-btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <ArrowLeft size={14} /> Back
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '13px' }}>
            <Link to="/alerts" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Dashboard</Link>
            <ChevronRight size={12} />
            <span style={{ color: 'var(--text-muted)' }}>Entity Profile</span>
            <ChevronRight size={12} />
            <span style={{ color: 'var(--text-primary)' }}>{ENTITY.name}</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)' }}>
            {ENTITY.name}
          </h1>
          <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>{displayId}</span>
          <span className="it-badge it-badge-critical" style={{ fontSize: '12px' }}>
            <ShieldAlert size={11} /> CRITICAL RISK
          </span>
        </div>
      </div>

      {/* ─── Hero Card ─── */}
      <div className="it-card" style={{ borderRadius: '16px', padding: '24px', marginBottom: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '32px' }}>
        {/* Left: Identity */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '64px', height: '64px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #F5A623, #D4891A)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '22px', fontWeight: 700, color: '#000',
              flexShrink: 0, boxShadow: '0 0 20px rgba(245,166,35,0.3)',
            }}>
              RM
            </div>
            <div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>{ENTITY.name}</div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>{ENTITY.accountType}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '1px' }}>{ENTITY.bank}</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Account ID</span>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'monospace' }}>{ENTITY.id}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Status</span>
              <span className="it-badge it-badge-critical" style={{ fontSize: '11px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#EF4444', display: 'inline-block' }} />
                {ENTITY.status}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Account Type</span>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{ENTITY.accountType}</span>
            </div>
          </div>
        </div>

        {/* Center: KYC Details */}
        <div>
          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '16px' }}>
            KYC Details
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {[
              { label: 'PAN', value: ENTITY.pan, icon: <CreditCard size={13} /> },
              { label: 'Aadhaar', value: ENTITY.aadhaar, icon: <User size={13} /> },
              { label: 'Date of Birth', value: ENTITY.dob, icon: <Calendar size={13} /> },
              { label: 'KYC Status', value: ENTITY.kycStatus, icon: <Activity size={13} /> },
            ].map(item => (
              <div key={item.label} style={{
                background: 'var(--bg-card-el)',
                borderRadius: '10px',
                padding: '12px',
                border: '1px solid var(--border)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '11px', marginBottom: '6px' }}>
                  {item.icon} {item.label}
                </div>
                <div style={{
                  fontSize: '13px',
                  fontWeight: 600,
                  color: item.label === 'KYC Status' ? '#4ADE80' : 'var(--text-primary)',
                  fontFamily: item.label === 'PAN' || item.label === 'Aadhaar' ? 'monospace' : 'inherit',
                }}>
                  {item.value}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Risk Metrics */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Risk Metrics
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{
              width: '96px', height: '96px', borderRadius: '50%',
              border: '5px solid #EF4444',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 30px rgba(239,68,68,0.35)',
              background: 'rgba(239,68,68,0.05)',
            }}>
              <span style={{ fontSize: '30px', fontWeight: 800, color: '#F87171', lineHeight: 1 }}>{ENTITY.riskScore}</span>
              <span style={{ fontSize: '10px', color: '#F87171', fontWeight: 600, marginTop: '2px' }}>/100</span>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '2px' }}>Percentile</div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#F87171' }}>{ENTITY.riskPercentile}</div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#F87171' }}>{ENTITY.fraudAlerts}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Fraud Alerts</div>
            </div>
            <div style={{ background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.2)', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#FB923C' }}>{ENTITY.caseCount}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Open Cases</div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Tabs ─── */}
      <div className="it-tabs" style={{ marginBottom: '24px' }}>
        {(['overview', 'transactions', 'network', 'devices'] as const).map(tab => (
          <button
            key={tab}
            className={`it-tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'overview' && 'Overview'}
            {tab === 'transactions' && 'Transactions'}
            {tab === 'network' && 'Network'}
            {tab === 'devices' && 'Devices & IPs'}
          </button>
        ))}
      </div>

      {/* ─── Tab Content ─── */}

      {activeTab === 'overview' && (
        <div className="it-fade-in">
          <div className="it-grid-2" style={{ marginBottom: '24px' }}>
            {/* Account Summary */}
            <div className="it-card">
              <div className="it-card-header">
                <span className="it-card-title">Account Summary</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  { label: 'Account Opening Date', value: ENTITY.openingDate },
                  { label: 'KYC Completed', value: ENTITY.kycDate },
                  { label: 'Current Balance', value: ENTITY.balance },
                  { label: 'Flagged Since', value: ENTITY.flaggedSince },
                  { label: 'Bank Name', value: ENTITY.bank },
                  { label: 'Account Type', value: ENTITY.accountType },
                ].map(row => (
                  <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{row.label}</span>
                    <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>{row.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Timeline Summary */}
            <div className="it-card">
              <div className="it-card-header">
                <span className="it-card-title">Activity Timeline</span>
              </div>
              <div className="it-timeline">
                {TIMELINE_EVENTS.map((ev, i) => (
                  <div key={i} className="it-timeline-item">
                    <div className={`it-timeline-dot`} style={{
                      borderColor: ev.type === 'critical' ? '#EF4444' : ev.type === 'high' ? '#F97316' : ev.type === 'medium' ? '#EAB308' : '#3B82F6',
                      color: ev.type === 'critical' ? '#EF4444' : ev.type === 'high' ? '#F97316' : ev.type === 'medium' ? '#EAB308' : '#3B82F6',
                    }}>
                      {ev.type === 'critical' || ev.type === 'high' ? <AlertTriangle size={12} /> : <Clock size={12} />}
                    </div>
                    <div className="it-timeline-content">
                      <div className="it-timeline-time">{ev.time}</div>
                      <div className="it-timeline-title">{ev.title}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Alerts */}
          <div className="it-card" style={{ marginBottom: '24px' }}>
            <div className="it-card-header">
              <span className="it-card-title">Recent Alerts</span>
              <span className="it-badge it-badge-critical">{ALERTS.length} Active</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {ALERTS.map(alert => (
                <div key={alert.id} style={{
                  display: 'flex', alignItems: 'center', gap: '16px',
                  padding: '14px', background: 'var(--bg-card-el)',
                  borderRadius: '10px', border: '1px solid var(--border)',
                }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(239,68,68,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <AlertTriangle size={16} color="#F87171" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{alert.type}</span>
                      <span className={riskBadge(alert.severity)} style={{ fontSize: '10px' }}>{alert.severity.toUpperCase()}</span>
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{alert.desc}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{alert.date}</div>
                    <div style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--text-muted)', marginTop: '2px' }}>{alert.id}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Linked Entities */}
          <div className="it-card">
            <div className="it-card-header">
              <span className="it-card-title">Linked Entities</span>
              <span className="it-badge it-badge-neutral">{LINKED_ENTITIES.length} connections</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {LINKED_ENTITIES.map(ent => (
                <div key={ent.id} style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '12px', background: 'var(--bg-card-el)',
                  borderRadius: '8px', border: '1px solid var(--border)',
                  cursor: 'pointer',
                }} onClick={() => navigate(`/entity/${ent.id}`)}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)', fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)', flexShrink: 0 }}>
                    {ent.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{ent.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{ent.id} · {ent.rel}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{ent.txnCount} txns</span>
                    <span className={riskBadge(ent.risk)} style={{ fontSize: '10px' }}>{ent.risk.toUpperCase()}</span>
                    <ExternalLink size={12} color="var(--text-muted)" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'transactions' && (
        <div className="it-fade-in">
          <div className="it-card">
            <div className="it-card-header" style={{ marginBottom: '16px' }}>
              <span className="it-card-title">Transaction History — {ENTITY.name}</span>
              <span className="it-badge it-badge-neutral">{TRANSACTIONS.length} records</span>
            </div>
            <div className="it-table-wrap">
              <table className="it-table">
                <thead>
                  <tr>
                    <th>Txn ID</th>
                    <th>Date & Time</th>
                    <th>Type</th>
                    <th>Amount</th>
                    <th>Counterparty</th>
                    <th>Channel</th>
                    <th>Status</th>
                    <th>Risk</th>
                  </tr>
                </thead>
                <tbody>
                  {TRANSACTIONS.map(tx => (
                    <tr key={tx.id}>
                      <td className="it-td-mono">{tx.id}</td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{tx.date}</td>
                      <td>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 600, color: tx.type === 'Credit' ? '#4ADE80' : '#F87171' }}>
                          {tx.type === 'Credit' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                          {tx.type}
                        </span>
                      </td>
                      <td className="it-td-primary" style={{ fontWeight: 700 }}>{tx.amount}</td>
                      <td>{tx.counterparty}</td>
                      <td><span className="it-badge it-badge-neutral" style={{ fontSize: '10px' }}>{tx.channel}</span></td>
                      <td>
                        <span className={
                          tx.status === 'Flagged' ? 'it-badge it-badge-critical' :
                          tx.status === 'Suspicious' ? 'it-badge it-badge-high' :
                          'it-badge it-badge-low'
                        } style={{ fontSize: '10px' }}>{tx.status}</span>
                      </td>
                      <td><span className={riskBadge(tx.risk)} style={{ fontSize: '10px' }}>{tx.risk.toUpperCase()}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'network' && (
        <div className="it-fade-in">
          <div className="it-card" style={{ padding: '0', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <span className="it-card-title">Transaction Network — 1-Hop Graph</span>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>Centered on {ENTITY.name} ({ENTITY.id})</div>
              </div>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                {[
                  { color: '#F5A623', label: 'Subject' },
                  { color: '#EF4444', label: 'Critical' },
                  { color: '#F97316', label: 'High Risk' },
                  { color: '#EAB308', label: 'Medium' },
                ].map(l => (
                  <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: l.color }} />
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{l.label}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ height: '520px', background: '#0D0D0D' }}>
              <CytoscapeComponent
                elements={GRAPH_ELEMENTS}
                stylesheet={CYTOSCAPE_STYLESHEET}
                layout={{ name: 'cose', animate: true, animationDuration: 800, nodeRepulsion: () => 8000, idealEdgeLength: () => 120, fit: true, padding: 40 } as any}
                style={{ width: '100%', height: '100%' }}
                cy={(cy) => {
                  cy.on('tap', 'node', (evt) => {
                    const node = evt.target;
                    console.log('Node clicked:', node.id(), node.data());
                  });
                }}
              />
            </div>
          </div>
        </div>
      )}

      {activeTab === 'devices' && (
        <div className="it-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Devices Table */}
          <div className="it-card">
            <div className="it-card-header">
              <span className="it-card-title">Registered Devices</span>
              <span className="it-badge it-badge-neutral">{DEVICES.length} devices</span>
            </div>
            <div className="it-table-wrap">
              <table className="it-table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Device ID</th>
                    <th>OS</th>
                    <th>First Seen</th>
                    <th>Last Seen</th>
                    <th>Location</th>
                    <th>Suspicious</th>
                  </tr>
                </thead>
                <tbody>
                  {DEVICES.map(dev => (
                    <tr key={dev.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {dev.type === 'Mobile' ? <Smartphone size={14} color="var(--text-secondary)" /> : dev.type === 'Tablet' ? <Monitor size={14} color="var(--text-secondary)" /> : <Monitor size={14} color="var(--text-secondary)" />}
                          <span style={{ color: 'var(--text-primary)' }}>{dev.type}</span>
                        </div>
                      </td>
                      <td className="it-td-mono" style={{ fontSize: '12px' }}>{dev.id}</td>
                      <td>{dev.os}</td>
                      <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{dev.firstSeen}</td>
                      <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{dev.lastSeen}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <MapPin size={12} color="var(--text-muted)" />
                          <span style={{ fontSize: '12px' }}>{dev.location}</span>
                        </div>
                      </td>
                      <td>
                        {dev.suspicious ? (
                          <span className="it-badge it-badge-critical" style={{ fontSize: '10px' }}>
                            <Flag size={10} /> Yes
                          </span>
                        ) : (
                          <span className="it-badge it-badge-low" style={{ fontSize: '10px' }}>No</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* IP Address Table */}
          <div className="it-card">
            <div className="it-card-header">
              <span className="it-card-title">IP Address History</span>
              <span className="it-badge it-badge-neutral">{IP_ADDRESSES.length} IPs</span>
            </div>
            <div className="it-table-wrap">
              <table className="it-table">
                <thead>
                  <tr>
                    <th>IP Address</th>
                    <th>ISP</th>
                    <th>Country</th>
                    <th>First Seen</th>
                    <th>Last Seen</th>
                    <th>VPN / Proxy</th>
                  </tr>
                </thead>
                <tbody>
                  {IP_ADDRESSES.map(ip => (
                    <tr key={ip.ip}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Wifi size={13} color="var(--text-muted)" />
                          <span className="it-td-mono">{ip.ip}</span>
                        </div>
                      </td>
                      <td>{ip.isp}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Globe size={12} color="var(--text-muted)" />
                          <span style={{ color: ip.country !== 'India' ? '#FB923C' : 'var(--text-secondary)' }}>{ip.country}</span>
                        </div>
                      </td>
                      <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{ip.firstSeen}</td>
                      <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{ip.lastSeen}</td>
                      <td>
                        {ip.vpn ? (
                          <span className="it-badge it-badge-critical" style={{ fontSize: '10px' }}>
                            <Flag size={10} /> VPN Detected
                          </span>
                        ) : (
                          <span className="it-badge it-badge-low" style={{ fontSize: '10px' }}>Clean</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
