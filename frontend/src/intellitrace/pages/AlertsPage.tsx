import React, { useState } from 'react';
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
import { useApi } from '../../hooks/useApi';

// ─── Types ────────────────────────────────────────────────────────────────────


interface ApiAlert {
  id: string;
  type: string;
  account_id: string;
  amount_formatted: string;
  risk_score: number;
  risk_level: string;
  status: string;
  timestamp: string;
  description: string;
  flag_reason: string;
  amount: number;
}

interface AlertsSummary {
  total: number;
  critical_open: number;
  avg_risk: number;
  resolved_today: number;
}

interface AlertsCounts {
  All: number;
  Critical: number;
  High: number;
  Medium: number;
  Low: number;
}

interface AlertsResponse {
  alerts: ApiAlert[];
  total: number;
  page: number;
  limit: number;
  summary: AlertsSummary;
  counts: AlertsCounts;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const RISK_COLORS: Record<string, { border: string; text: string; shadow: string }> = {
  critical: { border: '#EF4444', text: '#F87171', shadow: '0 0 18px rgba(239,68,68,0.25)' },
  high:     { border: '#F97316', text: '#FB923C', shadow: '0 0 18px rgba(249,115,22,0.25)' },
  medium:   { border: '#EAB308', text: '#FDE047', shadow: '0 0 18px rgba(234,179,8,0.25)'  },
  low:      { border: '#22C55E', text: '#4ADE80', shadow: '0 0 18px rgba(34,197,94,0.25)'  },
};

const RISK_BAR_COLORS: Record<string, string> = {
  critical: '#EF4444',
  high: '#F97316',
  medium: '#EAB308',
  low: '#22C55E',
};

const STATUS_BADGE: Record<string, string> = {
  'Open': 'it-badge-open',
  'Under Review': 'it-badge-review',
  'Resolved': 'it-badge-closed',
  'False Positive': 'it-badge-neutral',
};

function getTypeIcon(type: string): React.ReactNode {
  switch (type) {
    case 'Smurfing':           return <AlertTriangle size={13} />;
    case 'Round-Tripping':     return <TrendingUp size={13} />;
    case 'Rapid Layering':     return <ShieldAlert size={13} />;
    case 'Dormant Activation': return <Clock size={13} />;
    case 'Profile Mismatch':   return <Eye size={13} />;
    case 'Cross-Border Alert': return <Bell size={13} />;
    case 'Structuring':        return <Filter size={13} />;
    default:                   return <AlertTriangle size={13} />;
  }
}

const SORT_OPTIONS = ['Newest', 'Risk Score', 'Amount'];

// ─── Alert Card Component ─────────────────────────────────────────────────────

function AlertCard({ alert, onClick }: { alert: ApiAlert; onClick: () => void }) {
  const riskLevel = alert.risk_level?.toLowerCase() ?? 'low';
  const riskColors = RISK_COLORS[riskLevel] ?? RISK_COLORS.low;
  const rgbMap: Record<string, string> = {
    critical: '239,68,68',
    high: '249,115,22',
    medium: '234,179,8',
    low: '34,197,94',
  };
  const rgb = rgbMap[riskLevel] ?? '34,197,94';

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
      <div style={{ width: '4px', background: RISK_BAR_COLORS[riskLevel] ?? '#22C55E', flexShrink: 0 }} />

      {/* Main content */}
      <div style={{ flex: 1, padding: '16px', display: 'flex', gap: '16px', alignItems: 'center' }}>

        {/* Left: type icon */}
        <div style={{
          width: '40px', height: '40px', borderRadius: '10px', flexShrink: 0,
          background: `rgba(${rgb}, 0.12)`,
          border: `1px solid rgba(${rgb}, 0.25)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: riskColors.text,
        }}>
          {getTypeIcon(alert.type)}
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
            <span className={`it-badge ${STATUS_BADGE[alert.status] ?? 'it-badge-neutral'}`} style={{ fontSize: '10px' }}>
              {alert.status}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px', flexWrap: 'wrap' }}>
            <span style={{ fontFamily: 'Courier New, monospace', fontSize: '12px', color: '#777' }}>
              {alert.account_id}
            </span>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#fff', fontFamily: 'Inter, sans-serif' }}>
              {alert.amount_formatted}
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
            🚩 {alert.flag_reason}
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
              {alert.risk_score}
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

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

function AlertSkeleton() {
  return (
    <div style={{
      background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: '12px',
      display: 'flex', alignItems: 'stretch', overflow: 'hidden', height: '100px',
    }}>
      <div style={{ width: '4px', background: '#2A2A2A', flexShrink: 0 }} />
      <div style={{ flex: 1, padding: '16px', display: 'flex', gap: '16px', alignItems: 'center' }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: '#242424', flexShrink: 0 }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ height: 14, width: '40%', borderRadius: 6, background: '#242424' }} />
          <div style={{ height: 12, width: '60%', borderRadius: 6, background: '#1E1E1E' }} />
          <div style={{ height: 10, width: '80%', borderRadius: 6, background: '#1E1E1E' }} />
        </div>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#242424', flexShrink: 0 }} />
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

  // Build query string dynamically
  const params = new URLSearchParams({
    risk_level: activeTab,
    status: statusFilter,
    search: searchQuery,
    sort: sortBy,
    page: String(currentPage),
    limit: String(ITEMS_PER_PAGE),
  });
  const apiUrl = `/api/alerts?${params.toString()}`;

  const { data, loading, error } = useApi<AlertsResponse>(apiUrl, [
    activeTab, statusFilter, searchQuery, sortBy, currentPage,
  ]);

  const alerts = data?.alerts ?? [];
  const total = data?.total ?? 0;
  const summary = data?.summary ?? { total: 0, critical_open: 0, avg_risk: 0, resolved_today: 0 };
  const counts = data?.counts ?? { All: 0, Critical: 0, High: 0, Medium: 0, Low: 0 };
  const totalPages = Math.max(1, Math.ceil(total / ITEMS_PER_PAGE));

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  const TAB_KEYS: Array<keyof AlertsCounts> = ['All', 'Critical', 'High', 'Medium', 'Low'];

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
          { label: 'Total Alerts',   value: summary.total,          color: '#60A5FA' },
          { label: 'Critical Open',  value: summary.critical_open,   color: '#F87171' },
          { label: 'Avg Risk Score', value: summary.avg_risk,        color: '#F5A623' },
          { label: 'Resolved Today', value: summary.resolved_today,  color: '#4ADE80' },
        ].map(s => (
          <div key={s.label} style={{
            background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: '10px',
            padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '10px',
          }}>
            <span style={{ fontSize: '20px', fontWeight: 700, color: s.color, fontFamily: 'Inter, sans-serif' }}>
              {loading ? '—' : s.value}
            </span>
            <span style={{ fontSize: '12px', color: '#666', fontFamily: 'Inter, sans-serif' }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="it-tabs">
        {TAB_KEYS.map(tab => (
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
              {loading ? '…' : counts[tab]}
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
            onChange={e => { setSortBy(e.target.value); setCurrentPage(1); }}
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
          {loading ? 'Loading…' : `${total} result${total !== 1 ? 's' : ''}`}
        </span>
      </div>

      {/* Alert Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <AlertSkeleton key={i} />)
        ) : error ? (
          <div className="it-empty-state">
            <ShieldAlert size={36} color="#EF4444" />
            <div className="it-empty-title" style={{ color: '#F87171' }}>Failed to load alerts</div>
            <div className="it-empty-desc">{error}</div>
          </div>
        ) : alerts.length === 0 ? (
          <div className="it-empty-state">
            <Bell size={36} color="#333" />
            <div className="it-empty-title">No alerts found</div>
            <div className="it-empty-desc">Try adjusting your filters or search query.</div>
          </div>
        ) : (
          alerts.map(alert => (
            <AlertCard
              key={alert.id}
              alert={alert}
              onClick={() => navigate(`/alerts/${alert.id}`)}
            />
          ))
        )}
      </div>

      {/* Pagination */}
      {!loading && !error && total > 0 && (
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
      )}
    </div>
  );
}
