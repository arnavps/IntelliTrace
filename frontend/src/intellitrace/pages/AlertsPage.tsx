import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  AlertTriangle,
  ShieldAlert,
  Eye,
  Filter,
  Search,
  ChevronDown,
  Clock,
  TrendingUp,
  Plus,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import '../styles/dashboard.css';

// ─── Types ────────────────────────────────────────────────────────────────────

type RiskLevel = 'critical' | 'high' | 'medium' | 'low';
type AlertStatus = 'Open' | 'Under Review' | 'Resolved' | 'False Positive';
type AlertType =
  | 'Smurfing'
  | 'Round-Tripping'
  | 'Rapid Layering'
  | 'Dormant Activation'
  | 'Profile Mismatch'
  | 'Cross-Border Alert'
  | 'Structuring';

interface Alert {
  id: string;
  type: AlertType;
  accountId: string;
  amount: string;
  amountRaw: number;
  riskScore: number;
  riskLevel: RiskLevel;
  status: AlertStatus;
  timestamp: string;
  description: string;
  flagReason: string;
}

// ─── Mock Alerts ──────────────────────────────────────────────────────────────

const MOCK_ALERTS: Alert[] = [
  {
    id: 'ALT-8821',
    type: 'Round-Tripping',
    accountId: 'ACC-0001',
    amount: '₹4.85 Cr',
    amountRaw: 48500000,
    riskScore: 97,
    riskLevel: 'critical',
    status: 'Open',
    timestamp: '2026-05-26 00:02',
    description: 'Funds circulated through 4 shell entities and returned to origin account within 72h.',
    flagReason: 'ML model detected circular flow with >94% confidence using GNN embeddings.',
  },
  {
    id: 'ALT-7734',
    type: 'Smurfing',
    accountId: 'ACC-1204',
    amount: '₹2.12 Cr',
    amountRaw: 21200000,
    riskScore: 91,
    riskLevel: 'critical',
    status: 'Under Review',
    timestamp: '2026-05-25 22:14',
    description: '38 transactions of ₹4.99L each split across 12 sub-accounts over 6 hours.',
    flagReason: 'Structuring pattern detected — all transactions just below ₹5L reporting threshold.',
  },
  {
    id: 'ALT-6619',
    type: 'Rapid Layering',
    accountId: 'SHELL-A',
    amount: '₹7.40 Cr',
    amountRaw: 74000000,
    riskScore: 89,
    riskLevel: 'critical',
    status: 'Open',
    timestamp: '2026-05-25 23:45',
    description: 'Funds moved through 6 intermediary accounts in 5 countries within 18 hours.',
    flagReason: 'Velocity anomaly: 6 jurisdiction hops in <18h. Cross-border pattern matched against FATF typology.',
  },
  {
    id: 'ALT-5508',
    type: 'Dormant Activation',
    accountId: 'ACC-8821',
    amount: '₹1.30 Cr',
    amountRaw: 13000000,
    riskScore: 85,
    riskLevel: 'critical',
    status: 'Open',
    timestamp: '2026-05-26 00:02',
    description: 'Account dormant for 847 days suddenly received ₹1.3Cr from 3 unknown entities.',
    flagReason: 'Zero activity for 847 days followed by large inflow burst — high suspicion pattern.',
  },
  {
    id: 'ALT-4402',
    type: 'Cross-Border Alert',
    accountId: 'BANK-OFX',
    amount: '₹9.20 Cr',
    amountRaw: 92000000,
    riskScore: 82,
    riskLevel: 'critical',
    status: 'Open',
    timestamp: '2026-05-25 23:01',
    description: 'SWIFT transfers from Offshore Bank X to 3 Mauritius shell entities in 2h window.',
    flagReason: 'Offshore jurisdiction + shell entity pattern + SWIFT routing inconsistency flagged.',
  },
  {
    id: 'ALT-3391',
    type: 'Structuring',
    accountId: 'ACC-9932',
    amount: '₹3.80 Cr',
    amountRaw: 38000000,
    riskScore: 76,
    riskLevel: 'high',
    status: 'Under Review',
    timestamp: '2026-05-25 20:55',
    description: '22 cash deposits structured to avoid CTR reporting. Pattern spread over 4 branches.',
    flagReason: 'Rule engine: 22 deposits × ₹1.7L avg within 3 days across multiple branches.',
  },
  {
    id: 'ALT-2278',
    type: 'Round-Tripping',
    accountId: 'GHOST-T',
    amount: '₹5.60 Cr',
    amountRaw: 56000000,
    riskScore: 74,
    riskLevel: 'high',
    status: 'Open',
    timestamp: '2026-05-25 22:59',
    description: 'Ghost Traders Ltd used as transit node — inflow and outflow match within 2.4% margin.',
    flagReason: 'Amount conservation ratio 97.6%: classic layering behaviour with negligible fee leakage.',
  },
  {
    id: 'ALT-1165',
    type: 'Rapid Layering',
    accountId: 'BANK-DXB',
    amount: '₹6.80 Cr',
    amountRaw: 68000000,
    riskScore: 72,
    riskLevel: 'high',
    status: 'Under Review',
    timestamp: '2026-05-25 21:18',
    description: 'Dubai Bank SWIFT outflows to 4 UAE entities. Correspondent relationship not on approved list.',
    flagReason: 'Correspondent bank not on pre-approved list. Transaction volume spike 340% vs 90-day avg.',
  },
  {
    id: 'ALT-0954',
    type: 'Profile Mismatch',
    accountId: 'ACC-7711',
    amount: '₹45.0 L',
    amountRaw: 4500000,
    riskScore: 68,
    riskLevel: 'high',
    status: 'Open',
    timestamp: '2026-05-24 18:10',
    description: 'Retired individual account receiving ₹45L — inconsistent with declared income profile.',
    flagReason: 'KYC declared annual income ₹6L. Inflows 7.5× annual income in single month flagged.',
  },
  {
    id: 'ALT-0841',
    type: 'Smurfing',
    accountId: 'ACC-4450',
    amount: '₹27.0 L',
    amountRaw: 2700000,
    riskScore: 63,
    riskLevel: 'high',
    status: 'Resolved',
    timestamp: '2026-05-24 09:20',
    description: '15 micro-transactions from different IPs all rounded to ₹1.8L each, same merchant.',
    flagReason: 'Device fingerprint analysis: 15 distinct devices, same recipient merchant TXN-44509.',
  },
  {
    id: 'ALT-0730',
    type: 'Dormant Activation',
    accountId: 'ACC-3301',
    amount: '₹15.0 L',
    amountRaw: 1500000,
    riskScore: 54,
    riskLevel: 'medium',
    status: 'Under Review',
    timestamp: '2026-05-23 14:45',
    description: 'Account inactive 14 months. Received ₹15L then immediately transferred out within 90 minutes.',
    flagReason: 'Dormancy + immediate pass-through pattern. No fee / service transactions — pure transit.',
  },
  {
    id: 'ALT-0618',
    type: 'Profile Mismatch',
    accountId: 'ACC-3301',
    amount: '₹8.5 L',
    amountRaw: 850000,
    riskScore: 51,
    riskLevel: 'medium',
    status: 'Open',
    timestamp: '2026-05-23 11:22',
    description: 'Student account with 3 international SWIFT receipts totalling ₹8.5L in 10 days.',
    flagReason: 'International inflows inconsistent with student profile. Source of funds unverified.',
  },
  {
    id: 'ALT-0502',
    type: 'Structuring',
    accountId: 'BANK-MRX',
    amount: '₹43.0 L',
    amountRaw: 4300000,
    riskScore: 47,
    riskLevel: 'medium',
    status: 'False Positive',
    timestamp: '2026-05-24 16:30',
    description: 'Multiple small transfers to Mauritius Offshore flagged by rule engine for review.',
    flagReason: 'Rule-based: total offshore transfers exceeded ₹40L threshold in 7-day window.',
  },
  {
    id: 'ALT-0388',
    type: 'Cross-Border Alert',
    accountId: 'ACC-7711',
    amount: '₹21.0 L',
    amountRaw: 2100000,
    riskScore: 35,
    riskLevel: 'low',
    status: 'Resolved',
    timestamp: '2026-05-22 10:15',
    description: 'NEFT transfer to Singapore-based account without prior cross-border declaration.',
    flagReason: 'Cross-border declaration missing for transfer >₹15L. Regulatory compliance gap.',
  },
  {
    id: 'ALT-0271',
    type: 'Profile Mismatch',
    accountId: 'ACC-1204',
    amount: '₹9.8 L',
    amountRaw: 980000,
    riskScore: 28,
    riskLevel: 'low',
    status: 'False Positive',
    timestamp: '2026-05-21 08:40',
    description: 'Large salary credit to self-employed account flagged against declared income.',
    flagReason: 'Salary code used for self-employed account — income code mismatch in CBS system.',
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const RISK_COLORS: Record<RiskLevel, { border: string; text: string; shadow: string }> = {
  critical: { border: '#EF4444', text: '#F87171', shadow: '0 0 18px rgba(239,68,68,0.25)' },
  high:     { border: '#F97316', text: '#FB923C', shadow: '0 0 18px rgba(249,115,22,0.25)' },
  medium:   { border: '#EAB308', text: '#FDE047', shadow: '0 0 18px rgba(234,179,8,0.25)'  },
  low:      { border: '#22C55E', text: '#4ADE80', shadow: '0 0 18px rgba(34,197,94,0.25)'  },
};

const RISK_BAR_COLORS: Record<RiskLevel, string> = {
  critical: '#EF4444',
  high: '#F97316',
  medium: '#EAB308',
  low: '#22C55E',
};

const STATUS_BADGE: Record<AlertStatus, string> = {
  'Open': 'it-badge-open',
  'Under Review': 'it-badge-review',
  'Resolved': 'it-badge-closed',
  'False Positive': 'it-badge-neutral',
};

const TYPE_ICONS: Record<AlertType, React.ReactNode> = {
  'Smurfing':          <AlertTriangle size={13} />,
  'Round-Tripping':    <TrendingUp size={13} />,
  'Rapid Layering':    <ShieldAlert size={13} />,
  'Dormant Activation':<Clock size={13} />,
  'Profile Mismatch':  <Eye size={13} />,
  'Cross-Border Alert':<Bell size={13} />,
  'Structuring':       <Filter size={13} />,
};

const TAB_COUNTS: Record<string, number> = {
  All: 47,
  Critical: 12,
  High: 18,
  Medium: 11,
  Low: 6,
};

const SORT_OPTIONS = ['Newest', 'Risk Score', 'Amount'];

// ─── Alert Card Component ─────────────────────────────────────────────────────

function AlertCard({ alert, onClick }: { alert: Alert; onClick: () => void }) {
  const riskColors = RISK_COLORS[alert.riskLevel];

  return (
    <div
      onClick={onClick}
      style={{
        background: '#1A1A1A',
        border: '1px solid #2A2A2A',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'stretch',
        cursor: 'pointer',
        transition: 'all 0.18s ease',
        overflow: 'hidden',
        position: 'relative',
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.borderColor = '#383838';
        el.style.transform = 'translateY(-1px)';
        el.style.boxShadow = '0 6px 24px rgba(0,0,0,0.4)';
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.borderColor = '#2A2A2A';
        el.style.transform = 'translateY(0)';
        el.style.boxShadow = 'none';
      }}
    >
      {/* Risk indicator bar */}
      <div style={{ width: '4px', background: RISK_BAR_COLORS[alert.riskLevel], flexShrink: 0 }} />

      {/* Main content */}
      <div style={{ flex: 1, padding: '16px', display: 'flex', gap: '16px', alignItems: 'center' }}>

        {/* Left: type icon */}
        <div style={{
          width: '40px', height: '40px', borderRadius: '10px', flexShrink: 0,
          background: `rgba(${alert.riskLevel === 'critical' ? '239,68,68' : alert.riskLevel === 'high' ? '249,115,22' : alert.riskLevel === 'medium' ? '234,179,8' : '34,197,94'}, 0.12)`,
          border: `1px solid rgba(${alert.riskLevel === 'critical' ? '239,68,68' : alert.riskLevel === 'high' ? '249,115,22' : alert.riskLevel === 'medium' ? '234,179,8' : '34,197,94'}, 0.25)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: riskColors.text,
        }}>
          {TYPE_ICONS[alert.type]}
        </div>

        {/* Center: info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 700, color: '#fff' }}>
              {alert.id}
            </span>
            <span style={{ fontFamily: 'Courier New, monospace', fontSize: '11px', color: '#F5A623', background: 'rgba(245,166,35,0.1)', border: '1px solid rgba(245,166,35,0.2)', borderRadius: '5px', padding: '1px 7px' }}>
              {alert.type}
            </span>
            <span className={`it-badge ${STATUS_BADGE[alert.status]}`} style={{ fontSize: '10px' }}>
              {alert.status}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px', flexWrap: 'wrap' }}>
            <span style={{ fontFamily: 'Courier New, monospace', fontSize: '12px', color: '#777' }}>
              {alert.accountId}
            </span>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#fff', fontFamily: 'Inter, sans-serif' }}>
              {alert.amount}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#555', fontFamily: 'Inter, sans-serif' }}>
              <Clock size={10} />
              {alert.timestamp}
            </span>
          </div>

          <p style={{ fontSize: '12px', color: '#777', fontFamily: 'Inter, sans-serif', lineHeight: 1.5, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {alert.description}
          </p>

          <p style={{ fontSize: '11px', color: '#555', fontFamily: 'Inter, sans-serif', lineHeight: 1.4, margin: '4px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            🚩 {alert.flagReason}
          </p>
        </div>

        {/* Right: risk score circle + button */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '50%',
            border: `3px solid ${riskColors.border}`,
            boxShadow: riskColors.shadow,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontSize: '18px', fontWeight: 800, color: riskColors.text, fontFamily: 'Inter, sans-serif', lineHeight: 1 }}>
              {alert.riskScore}
            </span>
            <span style={{ fontSize: '9px', color: '#555', fontFamily: 'Inter, sans-serif', letterSpacing: '0.05em' }}>RISK</span>
          </div>

          <button
            onClick={e => { e.stopPropagation(); onClick(); }}
            className="it-btn it-btn-outline it-btn-sm"
            style={{ fontSize: '11px', gap: '4px', padding: '5px 10px' }}
          >
            <Eye size={11} />
            View
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function AlertsPage() {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortBy, setSortBy] = useState('Newest');
  const [currentPage, setCurrentPage] = useState(1);

  const ITEMS_PER_PAGE = 8;

  // Filter alerts
  const filteredAlerts = MOCK_ALERTS.filter(alert => {
    const matchesTab =
      activeTab === 'All' ||
      (activeTab === 'Critical' && alert.riskLevel === 'critical') ||
      (activeTab === 'High' && alert.riskLevel === 'high') ||
      (activeTab === 'Medium' && alert.riskLevel === 'medium') ||
      (activeTab === 'Low' && alert.riskLevel === 'low');

    const matchesStatus =
      statusFilter === 'All' || alert.status === statusFilter;

    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      alert.id.toLowerCase().includes(q) ||
      alert.accountId.toLowerCase().includes(q) ||
      alert.type.toLowerCase().includes(q) ||
      alert.description.toLowerCase().includes(q);

    return matchesTab && matchesStatus && matchesSearch;
  });

  // Sort
  const sortedAlerts = [...filteredAlerts].sort((a, b) => {
    if (sortBy === 'Risk Score') return b.riskScore - a.riskScore;
    if (sortBy === 'Amount') return b.amountRaw - a.amountRaw;
    // Newest
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });

  // Paginate
  const totalPages = Math.max(1, Math.ceil(sortedAlerts.length / ITEMS_PER_PAGE));
  const pageAlerts = sortedAlerts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  return (
    <div className="it-app it-content" style={{ minHeight: '100vh' }}>

      {/* Page Header */}
      <div className="it-page-header">
        <div>
          <h1 className="it-page-heading" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '10px', padding: '8px', display: 'flex' }}>
              <ShieldAlert size={18} color="#F87171" />
            </div>
            Alert Management
          </h1>
          <p className="it-page-subheading" style={{ marginTop: '4px' }}>
            Monitor and triage fraud alerts across all accounts and entities
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div className="it-live-dot">Live</div>
          <button className="it-btn it-btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
            <Plus size={14} />
            Create Alert
          </button>
        </div>
      </div>

      {/* Summary stat chips */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {[
          { label: 'Total Alerts', value: '47', color: '#60A5FA' },
          { label: 'Critical Open', value: '5', color: '#F87171' },
          { label: 'Avg Risk Score', value: '64', color: '#F5A623' },
          { label: 'Resolved Today', value: '3', color: '#4ADE80' },
        ].map(s => (
          <div key={s.label} style={{
            background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: '10px',
            padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '10px',
          }}>
            <span style={{ fontSize: '20px', fontWeight: 700, color: s.color, fontFamily: 'Inter, sans-serif' }}>{s.value}</span>
            <span style={{ fontSize: '12px', color: '#666', fontFamily: 'Inter, sans-serif' }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="it-tabs">
        {Object.entries(TAB_COUNTS).map(([tab, count]) => (
          <button
            key={tab}
            className={`it-tab${activeTab === tab ? ' active' : ''}`}
            onClick={() => handleTabChange(tab)}
          >
            {tab}
            <span style={{
              marginLeft: '6px',
              background: activeTab === tab
                ? (tab === 'Critical' ? 'rgba(239,68,68,0.2)' : tab === 'High' ? 'rgba(249,115,22,0.2)' : tab === 'Medium' ? 'rgba(234,179,8,0.2)' : tab === 'Low' ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.1)')
                : 'rgba(255,255,255,0.06)',
              color: activeTab === tab
                ? (tab === 'Critical' ? '#F87171' : tab === 'High' ? '#FB923C' : tab === 'Medium' ? '#FDE047' : tab === 'Low' ? '#4ADE80' : '#fff')
                : '#555',
              borderRadius: '10px',
              padding: '1px 7px',
              fontSize: '11px',
              fontWeight: 700,
            }}>
              {count}
            </span>
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="it-toolbar" style={{ marginBottom: '20px' }}>
        {/* Search */}
        <div className="it-search" style={{ flex: '1 1 220px', maxWidth: '320px' }}>
          <Search size={13} className="it-search-icon" />
          <input
            className="it-input"
            style={{ paddingLeft: '36px', fontSize: '13px' }}
            placeholder="Search alerts, accounts..."
            value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
          />
        </div>

        {/* Status filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Filter size={13} color="#666" />
          <select
            className="it-input it-select"
            style={{ width: 'auto', fontSize: '12px', padding: '7px 28px 7px 10px' }}
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }}
          >
            <option>All</option>
            <option>Open</option>
            <option>Under Review</option>
            <option>Resolved</option>
            <option>False Positive</option>
          </select>
        </div>

        {/* Sort */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <ChevronDown size={13} color="#666" />
          <select
            className="it-input it-select"
            style={{ width: 'auto', fontSize: '12px', padding: '7px 28px 7px 10px' }}
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
          >
            {SORT_OPTIONS.map(o => <option key={o}>{o}</option>)}
          </select>
        </div>

        {/* Date range */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Clock size={13} color="#666" />
          <select
            className="it-input it-select"
            style={{ width: 'auto', fontSize: '12px', padding: '7px 28px 7px 10px' }}
            defaultValue="Last 7 days"
          >
            <option>Last 24 hours</option>
            <option>Last 7 days</option>
            <option>Last 30 days</option>
            <option>Custom range</option>
          </select>
        </div>

        {/* Results count */}
        <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#555', fontFamily: 'Inter, sans-serif', whiteSpace: 'nowrap' }}>
          {filteredAlerts.length} result{filteredAlerts.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Alert Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
        {pageAlerts.length === 0 ? (
          <div className="it-empty-state">
            <Bell size={36} color="#333" />
            <div className="it-empty-title">No alerts found</div>
            <div className="it-empty-desc">Try adjusting your filters or search query.</div>
          </div>
        ) : (
          pageAlerts.map(alert => (
            <AlertCard
              key={alert.id}
              alert={alert}
              onClick={() => navigate(`/alerts/${alert.id}`)}
            />
          ))
        )}
      </div>

      {/* Pagination */}
      <div className="it-pagination">
        <span style={{ fontSize: '12px', color: '#555', fontFamily: 'Inter, sans-serif', marginRight: '6px' }}>
          Page {currentPage} of {totalPages}
        </span>
        <button
          className="it-page-btn"
          disabled={currentPage === 1}
          onClick={() => setCurrentPage(p => p - 1)}
        >
          <ChevronLeft size={14} />
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
          <button
            key={p}
            className={`it-page-btn${p === currentPage ? ' active' : ''}`}
            onClick={() => setCurrentPage(p)}
          >
            {p}
          </button>
        ))}
        <button
          className="it-page-btn"
          disabled={currentPage === totalPages}
          onClick={() => setCurrentPage(p => p + 1)}
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
