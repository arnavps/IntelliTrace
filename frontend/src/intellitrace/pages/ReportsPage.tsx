import { useState, useCallback } from 'react';
import {
  FileText,
  Download,
  Filter,
  Calendar,
  BarChart2,
  Shield,
  AlertCircle,
  CheckCircle,
  Clock,
  Loader,
  X,
  RefreshCw,
  Eye,
  Copy,
} from 'lucide-react';
import '../styles/dashboard.css';
import { useApi, apiPost, getUser } from '../../hooks/useApi';

// ─── Toast notification hook ──────────────────────────────────────────────────
function useToast() {
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'info' | 'error' } | null>(null);
  const show = useCallback((msg: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }, []);
  return { toast, show };
}

// ─── Types ─────────────────────────────────────────────────────────────────────

type ReportType = 'STR' | 'SAR' | 'Investigation' | 'Risk Assessment';
type ReportFormat = 'PDF' | 'CSV' | 'Excel';

interface GeneratedReport {
  id: string;
  type: string;
  date_range: string;
  status: string;
  format: string;
  file_size?: string;
  generated_by_name: string;
  generated_at: string;
}

interface ReportsSummary {
  total: number;
  this_month: number;
  pending: number;
  failed: number;
}

interface LastGenerated {
  STR?: string;
  SAR?: string;
  Investigation?: string;
  'Risk Assessment'?: string;
}

interface ReportsResponse {
  reports: GeneratedReport[];
  summary: ReportsSummary;
  last_generated: LastGenerated;
}

// ─── Static Report Type Config (UI only, no data) ────────────────────────────

const REPORT_TYPES = [
  {
    type: 'STR' as ReportType,
    icon: <AlertCircle size={28} />,
    title: 'Suspicious Transaction Report',
    subtitle: 'STR — FIU-IND Format',
    description: 'Mandatory report for the Financial Intelligence Unit of India. Covers all flagged transactions meeting regulatory thresholds.',
    compliance: 'FIU-IND Compliant',
    accentColor: '#F5A623',
    borderColor: 'rgba(245,166,35,0.4)',
    bgColor: 'rgba(245,166,35,0.05)',
    badgeClass: 'it-badge-accent',
  },
  {
    type: 'SAR' as ReportType,
    icon: <Shield size={28} />,
    title: 'Suspicious Activity Report',
    subtitle: 'SAR — FinCEN Format',
    description: 'Compliant with FinCEN requirements. Covers suspicious account behaviors, pattern analysis, and entity relationships.',
    compliance: 'FinCEN Compliant',
    accentColor: '#3B82F6',
    borderColor: 'rgba(59,130,246,0.35)',
    bgColor: 'rgba(59,130,246,0.05)',
    badgeClass: 'it-badge-info',
  },
  {
    type: 'Investigation' as ReportType,
    icon: <FileText size={28} />,
    title: 'Investigation Report',
    subtitle: 'Internal Case Format',
    description: 'Comprehensive internal investigation summary including entity profiles, transaction networks, and analyst notes.',
    compliance: 'Internal Format',
    accentColor: '#8B5CF6',
    borderColor: 'rgba(139,92,246,0.35)',
    bgColor: 'rgba(139,92,246,0.05)',
    badgeClass: 'it-badge-review',
  },
  {
    type: 'Risk Assessment' as ReportType,
    icon: <BarChart2 size={28} />,
    title: 'Risk Assessment Report',
    subtitle: 'Model & Portfolio Metrics',
    description: 'Quantitative risk model output including GNN scores, XGBoost confidence intervals, and portfolio risk distribution.',
    compliance: 'Model Metrics',
    accentColor: '#22C55E',
    borderColor: 'rgba(34,197,94,0.35)',
    bgColor: 'rgba(34,197,94,0.05)',
    badgeClass: 'it-badge-low',
  },
];

// ─── Modal Component ───────────────────────────────────────────────────────────

interface GenerateModalProps {
  reportType: ReportType;
  onClose: () => void;
  onSuccess: () => void;
}

function GenerateModal({ reportType, onClose, onSuccess }: GenerateModalProps) {
  const [fromDate, setFromDate] = useState('2025-05-01');
  const [toDate, setToDate] = useState('2025-05-24');
  const [entityFilter, setEntityFilter] = useState('');
  const [riskThreshold, setRiskThreshold] = useState(75);
  const [format, setFormat] = useState<ReportFormat>('PDF');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleGenerate = async () => {
    setStatus('loading');
    setErrorMsg('');
    try {
      const user = getUser();
      const generatedByName = user?.name || user?.username || 'Unknown User';
      await apiPost('/api/reports', {
        type: reportType,
        date_range: `${fromDate} – ${toDate}`,
        format,
        generated_by_name: generatedByName,
      });
      setStatus('success');
      onSuccess();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to generate report');
      setStatus('error');
    }
  };

  return (
    <div className="it-modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="it-modal" style={{ maxWidth: '540px' }}>
        <div className="it-modal-header">
          <div>
            <div className="it-modal-title">Generate {reportType} Report</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>Configure parameters for report generation</div>
          </div>
          <button onClick={onClose} className="it-btn it-btn-ghost it-btn-sm" style={{ padding: '6px' }}>
            <X size={16} />
          </button>
        </div>

        {status === 'success' ? (
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(34,197,94,0.12)', border: '2px solid rgba(34,197,94,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <CheckCircle size={28} color="#4ADE80" />
            </div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>Report Generated Successfully</div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>Your {reportType} report ({format}) is queued for delivery.</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '24px', background: 'rgba(245,166,35,0.08)', border: '1px solid rgba(245,166,35,0.2)', borderRadius: 8, padding: '8px 12px' }}>
              📧 Report will be emailed when ready, or download from the reports table below.
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button className="it-btn it-btn-primary" onClick={onSuccess}>
                <CheckCircle size={14} /> View in Reports Table
              </button>
              <button className="it-btn it-btn-outline" onClick={onClose}>Close</button>
            </div>
          </div>
        ) : (
          <>
            {/* Date Range */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div className="it-form-group" style={{ marginBottom: 0 }}>
                <label className="it-label">From Date</label>
                <input type="date" className="it-input" value={fromDate} onChange={e => setFromDate(e.target.value)} />
              </div>
              <div className="it-form-group" style={{ marginBottom: 0 }}>
                <label className="it-label">To Date</label>
                <input type="date" className="it-input" value={toDate} onChange={e => setToDate(e.target.value)} />
              </div>
            </div>

            {/* Entity Filter */}
            <div className="it-form-group">
              <label className="it-label">Entity / Account Filter</label>
              <input
                type="text"
                className="it-input"
                placeholder="Enter entity name, account ID or leave blank for all"
                value={entityFilter}
                onChange={e => setEntityFilter(e.target.value)}
              />
            </div>

            {/* Risk Threshold Slider */}
            <div className="it-form-group">
              <label className="it-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Risk Score Threshold</span>
                <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{riskThreshold}</span>
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={riskThreshold}
                onChange={e => setRiskThreshold(Number(e.target.value))}
                style={{
                  width: '100%', height: '6px', borderRadius: '3px',
                  background: `linear-gradient(to right, #F5A623 ${riskThreshold}%, #2A2A2A ${riskThreshold}%)`,
                  outline: 'none', cursor: 'pointer', appearance: 'none',
                  WebkitAppearance: 'none',
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                <span>0 — Low Risk</span>
                <span>100 — Highest Risk</span>
              </div>
            </div>

            {/* Format Toggle */}
            <div className="it-form-group">
              <label className="it-label">Output Format</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {(['PDF', 'CSV', 'Excel'] as ReportFormat[]).map(f => (
                  <button
                    key={f}
                    onClick={() => setFormat(f)}
                    style={{
                      padding: '8px 20px',
                      borderRadius: '8px',
                      border: `1px solid ${format === f ? 'var(--accent)' : 'var(--border)'}`,
                      background: format === f ? 'rgba(245,166,35,0.12)' : 'var(--bg-card-el)',
                      color: format === f ? 'var(--accent)' : 'var(--text-secondary)',
                      fontSize: '13px',
                      fontWeight: format === f ? 600 : 400,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {status === 'error' && (
              <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: '#F87171', marginBottom: '8px' }}>
                {errorMsg}
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
              <button
                className="it-btn it-btn-primary"
                style={{ flex: 1 }}
                onClick={handleGenerate}
                disabled={status === 'loading'}
              >
                {status === 'loading' ? (
                  <>
                    <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} />
                    Generating Report...
                  </>
                ) : (
                  <>
                    <FileText size={14} />
                    Generate Report
                  </>
                )}
              </button>
              <button className="it-btn it-btn-outline" onClick={onClose}>Cancel</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const [modalType, setModalType] = useState<ReportType | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const { toast, show: showToast } = useToast();
  const [retryingId, setRetryingId] = useState<string | null>(null);

  const apiUrl = `/api/reports?status_filter=${filterStatus}`;
  const { data, loading, error, refetch } = useApi<ReportsResponse>(apiUrl, [filterStatus]);

  const reports: GeneratedReport[] = data?.reports ?? [];
  const summary: ReportsSummary = data?.summary ?? { total: 0, this_month: 0, pending: 0, failed: 0 };
  const lastGenerated: LastGenerated = data?.last_generated ?? {};

  const handleModalSuccess = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleDownload = useCallback((reportId: string, fmt: string) => {
    showToast(`Preparing ${fmt} download for ${reportId}… Check your downloads shortly.`, 'info');
  }, [showToast]);

  const handleRetry = useCallback(async (report: GeneratedReport) => {
    setRetryingId(report.id);
    try {
      const user = getUser();
      await apiPost('/api/reports', {
        type: report.type,
        date_range: report.date_range,
        format: report.format,
        generated_by_name: user?.name || 'System',
      });
      refetch();
      showToast(`Report ${report.id} re-queued successfully.`, 'success');
    } catch {
      showToast('Failed to retry report generation.', 'error');
    } finally {
      setRetryingId(null);
    }
  }, [refetch, showToast]);

  const handleViewDetails = useCallback((reportId: string) => {
    navigator.clipboard.writeText(reportId).catch(() => {});
    showToast(`Report ID "${reportId}" copied to clipboard.`, 'info');
  }, [showToast]);

  const summaryStats = [
    { label: 'Total Reports', value: summary.total, icon: <FileText size={20} />, color: '#F5A623', bg: 'rgba(245,166,35,0.1)', border: 'rgba(245,166,35,0.2)' },
    { label: 'This Month', value: summary.this_month, icon: <Calendar size={20} />, color: '#3B82F6', bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.2)' },
    { label: 'Pending', value: summary.pending, icon: <Clock size={20} />, color: '#EAB308', bg: 'rgba(234,179,8,0.1)', border: 'rgba(234,179,8,0.2)' },
    { label: 'Failed', value: summary.failed, icon: <AlertCircle size={20} />, color: '#EF4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.2)' },
  ];

  return (
    <div className="it-app" style={{ background: 'var(--bg-page)', minHeight: '100vh', padding: '24px' }}>
      {/* ─── Header ─── */}
      <div className="it-page-header">
        <div>
          <h1 className="it-page-heading">Reports &amp; Compliance</h1>
          <p className="it-page-subheading">Generate and manage regulatory reports across all formats</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {toast && (
            <div style={{
              padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 500,
              background: toast.type === 'success' ? 'rgba(34,197,94,0.12)' : toast.type === 'error' ? 'rgba(239,68,68,0.12)' : 'rgba(59,130,246,0.12)',
              border: `1px solid ${toast.type === 'success' ? 'rgba(34,197,94,0.3)' : toast.type === 'error' ? 'rgba(239,68,68,0.3)' : 'rgba(59,130,246,0.3)'}`,
              color: toast.type === 'success' ? '#4ADE80' : toast.type === 'error' ? '#F87171' : '#60A5FA',
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              {toast.type === 'success' ? <CheckCircle size={13} /> : toast.type === 'error' ? <AlertCircle size={13} /> : <Eye size={13} />}
              {toast.msg}
            </div>
          )}
          <button className="it-btn it-btn-outline it-btn-sm" onClick={() => refetch()}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {/* ─── Summary Stats ─── */}
      <div className="it-stat-grid" style={{ marginBottom: '28px' }}>
        {summaryStats.map(stat => (
          <div key={stat.label} className="it-card it-card-flat" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '18px' }}>
            <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: stat.bg, border: `1px solid ${stat.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: stat.color, flexShrink: 0 }}>
              {stat.icon}
            </div>
            <div>
              <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
                {loading ? '—' : stat.value}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '3px' }}>{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ─── Report Type Cards ─── */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px' }}>
          Report Templates
        </div>
        <div className="it-grid-2">
          {REPORT_TYPES.map(rt => {
            const lastGen = lastGenerated[rt.type];
            return (
              <div
                key={rt.type}
                style={{
                  background: 'var(--bg-card)',
                  border: `1px solid ${rt.borderColor}`,
                  borderRadius: '16px',
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = rt.bgColor; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-card)'; }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div style={{ color: rt.accentColor }}>{rt.icon}</div>
                  <span className={`it-badge ${rt.badgeClass}`} style={{ fontSize: '10px' }}>{rt.compliance}</span>
                </div>
                <div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>{rt.title}</div>
                  <div style={{ fontSize: '12px', color: rt.accentColor, fontWeight: 600, marginBottom: '8px' }}>{rt.subtitle}</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{rt.description}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: 'var(--text-muted)' }}>
                    <Clock size={11} />
                    {loading ? 'Loading…' : lastGen ? `Last generated ${lastGen}` : 'Never generated'}
                  </div>
                  <button
                    className="it-btn it-btn-primary it-btn-sm"
                    style={{ background: rt.accentColor, borderColor: rt.accentColor, color: '#000' }}
                    onClick={() => setModalType(rt.type)}
                  >
                    <FileText size={12} /> Generate
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── Generated Reports Table ─── */}
      <div className="it-card">
        <div className="it-card-header" style={{ marginBottom: '16px' }}>
          <div>
            <span className="it-card-title">Generated Reports</span>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
              {loading ? 'Loading…' : error ? 'Error loading reports' : `Showing ${reports.length} reports`}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <select
                className="it-input it-select"
                style={{ paddingRight: '32px', paddingLeft: '12px', height: '34px', fontSize: '12px', width: 'auto' }}
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
              >
                <option>All</option>
                <option>Ready</option>
                <option>Processing</option>
                <option>Failed</option>
              </select>
            </div>
            <button className="it-btn it-btn-outline it-btn-sm">
              <Download size={13} /> Export List
            </button>
          </div>
        </div>

        {error && (
          <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '10px', padding: '16px', textAlign: 'center', color: '#F87171', fontSize: '13px', marginBottom: '16px' }}>
            <AlertCircle size={16} style={{ display: 'inline', marginRight: '6px' }} />
            {error}
          </div>
        )}

        {loading && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
            <Loader size={24} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 8px' }} />
            <div style={{ fontSize: '13px' }}>Loading reports…</div>
          </div>
        )}

        {!loading && !error && (
          <div className="it-table-wrap">
            <table className="it-table">
              <thead>
                <tr>
                  <th>Report ID</th>
                  <th>Type</th>
                  <th>Date Range</th>
                  <th>Generated At</th>
                  <th>Generated By</th>
                  <th>Status</th>
                  <th>Format</th>
                  <th>Size</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {reports.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)', fontSize: '13px' }}>
                      No reports found for the selected filter.
                    </td>
                  </tr>
                ) : (
                  reports.map(report => (
                    <tr key={report.id}>
                      <td className="it-td-mono" style={{ fontSize: '12px' }}>{report.id}</td>
                      <td>
                        <span style={{
                          fontSize: '12px', fontWeight: 600,
                          color: report.type === 'STR' ? '#F5A623' : report.type === 'SAR' ? '#60A5FA' : report.type === 'Investigation' ? '#A78BFA' : '#4ADE80',
                        }}>
                          {report.type}
                        </span>
                      </td>
                      <td style={{ fontSize: '12px' }}>{report.date_range}</td>
                      <td style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{report.generated_at}</td>
                      <td style={{ fontSize: '12px' }}>{report.generated_by_name}</td>
                      <td>
                        {report.status === 'Ready' && (
                          <span className="it-badge it-badge-low" style={{ fontSize: '10px' }}>
                            <CheckCircle size={10} /> Ready
                          </span>
                        )}
                        {report.status === 'Processing' && (
                          <span className="it-badge it-badge-accent" style={{ fontSize: '10px' }}>
                            <Loader size={10} style={{ animation: 'spin 1s linear infinite' }} /> Processing
                          </span>
                        )}
                        {report.status === 'Failed' && (
                          <span className="it-badge it-badge-critical" style={{ fontSize: '10px' }}>
                            <AlertCircle size={10} /> Failed
                          </span>
                        )}
                      </td>
                      <td>
                        <span className="it-badge it-badge-neutral" style={{ fontSize: '10px' }}>
                          {report.format}
                        </span>
                      </td>
                      <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{report.file_size ?? '—'}</td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                          {report.status === 'Ready' && (
                            <>
                              <button
                                className="it-btn it-btn-outline it-btn-sm"
                                onClick={() => handleDownload(report.id, 'PDF')}
                                title="Download PDF"
                                style={{ padding: '4px 10px', fontSize: '11px' }}
                              >
                                <Download size={11} /> PDF
                              </button>
                              <button
                                className="it-btn it-btn-outline it-btn-sm"
                                onClick={() => handleDownload(report.id, 'CSV')}
                                title="Download CSV"
                                style={{ padding: '4px 10px', fontSize: '11px' }}
                              >
                                <Download size={11} /> CSV
                              </button>
                            </>
                          )}
                          {report.status === 'Failed' && (
                            <button
                              className="it-btn it-btn-outline it-btn-sm"
                              onClick={() => handleRetry(report)}
                              disabled={retryingId === report.id}
                              style={{ padding: '4px 10px', fontSize: '11px' }}
                            >
                              {retryingId === report.id
                                ? <Loader size={11} style={{ animation: 'spin 1s linear infinite' }} />
                                : <RefreshCw size={11} />}
                              {retryingId === report.id ? 'Retrying…' : 'Retry'}
                            </button>
                          )}
                          {report.status === 'Processing' && (
                            <button
                              className="it-btn it-btn-ghost it-btn-sm"
                              style={{ padding: '4px 10px', fontSize: '11px', opacity: 0.5, cursor: 'default' }}
                              disabled
                            >
                              <Loader size={11} style={{ animation: 'spin 1s linear infinite' }} /> In Progress
                            </button>
                          )}
                          <button
                            className="it-btn it-btn-ghost it-btn-sm"
                            style={{ padding: '4px 8px' }}
                            onClick={() => handleViewDetails(report.id)}
                            title="Copy Report ID"
                          >
                            <Copy size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        <div className="it-pagination">
          <button className="it-page-btn" disabled>‹</button>
          <button className="it-page-btn active">1</button>
          <button className="it-page-btn">2</button>
          <button className="it-page-btn">3</button>
          <button className="it-page-btn">›</button>
        </div>
      </div>

      {/* ─── Generate Modal ─── */}
      {modalType && (
        <GenerateModal
          reportType={modalType}
          onClose={() => setModalType(null)}
          onSuccess={handleModalSuccess}
        />
      )}

      {/* Inline styles for range input thumb */}
      <style>{`
        input[type='range']::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 18px; height: 18px;
          border-radius: 50%;
          background: #F5A623;
          cursor: pointer;
          box-shadow: 0 0 8px rgba(245,166,35,0.5);
          border: 2px solid #1A1A1A;
        }
        input[type='range']::-moz-range-thumb {
          width: 18px; height: 18px;
          border-radius: 50%;
          background: #F5A623;
          cursor: pointer;
          border: 2px solid #1A1A1A;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
