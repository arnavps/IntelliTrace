import { useState } from 'react';
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
} from 'lucide-react';
import '../styles/dashboard.css';

// ─── Types ─────────────────────────────────────────────────────────────────────

type ReportType = 'STR' | 'SAR' | 'Investigation' | 'Risk Assessment';
type ReportFormat = 'PDF' | 'CSV' | 'Excel';
type ReportStatus = 'Ready' | 'Processing' | 'Failed';

interface GeneratedReport {
  id: string;
  type: ReportType;
  dateRange: string;
  generatedAt: string;
  status: ReportStatus;
  format: ReportFormat;
  size: string;
  generatedBy: string;
}

// ─── Mock Data ─────────────────────────────────────────────────────────────────

const REPORT_TYPES = [
  {
    type: 'STR' as ReportType,
    icon: <AlertCircle size={28} />,
    title: 'Suspicious Transaction Report',
    subtitle: 'STR — FIU-IND Format',
    description: 'Mandatory report for the Financial Intelligence Unit of India. Covers all flagged transactions meeting regulatory thresholds.',
    compliance: 'FIU-IND Compliant',
    lastGenerated: '3 days ago',
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
    lastGenerated: '7 days ago',
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
    lastGenerated: '1 day ago',
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
    lastGenerated: '12 days ago',
    accentColor: '#22C55E',
    borderColor: 'rgba(34,197,94,0.35)',
    bgColor: 'rgba(34,197,94,0.05)',
    badgeClass: 'it-badge-low',
  },
];

const GENERATED_REPORTS: GeneratedReport[] = [
  { id: 'RPT-2025-0156', type: 'STR', dateRange: '01 May – 24 May 2025', generatedAt: '24 May 2025, 10:31 AM', status: 'Ready', format: 'PDF', size: '2.4 MB', generatedBy: 'Admin User' },
  { id: 'RPT-2025-0155', type: 'SAR', dateRange: '01 Apr – 30 Apr 2025', generatedAt: '23 May 2025, 03:12 PM', status: 'Ready', format: 'Excel', size: '1.8 MB', generatedBy: 'Priya Analyst' },
  { id: 'RPT-2025-0154', type: 'Investigation', dateRange: 'Case CAS-0031', generatedAt: '22 May 2025, 11:45 AM', status: 'Processing', format: 'PDF', size: '—', generatedBy: 'Ravi Investigator' },
  { id: 'RPT-2025-0153', type: 'Risk Assessment', dateRange: 'Q1 2025', generatedAt: '21 May 2025, 09:00 AM', status: 'Ready', format: 'PDF', size: '5.1 MB', generatedBy: 'Admin User' },
  { id: 'RPT-2025-0152', type: 'STR', dateRange: '01 Apr – 30 Apr 2025', generatedAt: '20 May 2025, 02:30 PM', status: 'Ready', format: 'CSV', size: '890 KB', generatedBy: 'Admin User' },
  { id: 'RPT-2025-0151', type: 'SAR', dateRange: '01 Mar – 31 Mar 2025', generatedAt: '15 May 2025, 04:00 PM', status: 'Failed', format: 'PDF', size: '—', generatedBy: 'Priya Analyst' },
  { id: 'RPT-2025-0150', type: 'Investigation', dateRange: 'Case CAS-0028', generatedAt: '12 May 2025, 01:15 PM', status: 'Ready', format: 'PDF', size: '3.2 MB', generatedBy: 'Ravi Investigator' },
  { id: 'RPT-2025-0149', type: 'STR', dateRange: '01 Mar – 31 Mar 2025', generatedAt: '10 May 2025, 11:00 AM', status: 'Ready', format: 'Excel', size: '1.1 MB', generatedBy: 'Admin User' },
  { id: 'RPT-2025-0148', type: 'Risk Assessment', dateRange: 'Mar 2025 Monthly', generatedAt: '05 May 2025, 09:30 AM', status: 'Ready', format: 'PDF', size: '4.3 MB', generatedBy: 'Admin User' },
  { id: 'RPT-2025-0147', type: 'SAR', dateRange: '01 Feb – 28 Feb 2025', generatedAt: '01 May 2025, 10:00 AM', status: 'Ready', format: 'CSV', size: '760 KB', generatedBy: 'Priya Analyst' },
];

const SUMMARY_STATS = [
  { label: 'Total Reports', value: 156, icon: <FileText size={20} />, color: '#F5A623', bg: 'rgba(245,166,35,0.1)', border: 'rgba(245,166,35,0.2)' },
  { label: 'This Month', value: 23, icon: <Calendar size={20} />, color: '#3B82F6', bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.2)' },
  { label: 'Pending', value: 3, icon: <Clock size={20} />, color: '#EAB308', bg: 'rgba(234,179,8,0.1)', border: 'rgba(234,179,8,0.2)' },
  { label: 'Failed', value: 1, icon: <AlertCircle size={20} />, color: '#EF4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.2)' },
];

// ─── Modal Component ───────────────────────────────────────────────────────────

interface GenerateModalProps {
  reportType: ReportType;
  onClose: () => void;
}

function GenerateModal({ reportType, onClose }: GenerateModalProps) {
  const [fromDate, setFromDate] = useState('2025-05-01');
  const [toDate, setToDate] = useState('2025-05-24');
  const [entityFilter, setEntityFilter] = useState('');
  const [riskThreshold, setRiskThreshold] = useState(75);
  const [format, setFormat] = useState<ReportFormat>('PDF');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');

  const handleGenerate = () => {
    setStatus('loading');
    setTimeout(() => setStatus('success'), 2200);
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
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '24px' }}>Your {reportType} report is ready for download.</div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button className="it-btn it-btn-primary" onClick={() => console.log('Downloading report...')}>
                <Download size={14} /> Download {format}
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

  const filteredReports = filterStatus === 'All'
    ? GENERATED_REPORTS
    : GENERATED_REPORTS.filter(r => r.status === filterStatus);

  return (
    <div className="it-app" style={{ background: 'var(--bg-page)', minHeight: '100vh', padding: '24px' }}>
      {/* ─── Header ─── */}
      <div className="it-page-header">
        <div>
          <h1 className="it-page-heading">Reports & Compliance</h1>
          <p className="it-page-subheading">Generate and manage regulatory reports across all formats</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="it-btn it-btn-outline it-btn-sm">
            <Filter size={14} /> Filter
          </button>
          <button className="it-btn it-btn-outline it-btn-sm">
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {/* ─── Summary Stats ─── */}
      <div className="it-stat-grid" style={{ marginBottom: '28px' }}>
        {SUMMARY_STATS.map(stat => (
          <div key={stat.label} className="it-card it-card-flat" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '18px' }}>
            <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: stat.bg, border: `1px solid ${stat.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: stat.color, flexShrink: 0 }}>
              {stat.icon}
            </div>
            <div>
              <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>{stat.value}</div>
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
          {REPORT_TYPES.map(rt => (
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
                  Last generated {rt.lastGenerated}
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
          ))}
        </div>
      </div>

      {/* ─── Generated Reports Table ─── */}
      <div className="it-card">
        <div className="it-card-header" style={{ marginBottom: '16px' }}>
          <div>
            <span className="it-card-title">Generated Reports</span>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Showing {filteredReports.length} of {GENERATED_REPORTS.length} reports
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
              {filteredReports.map(report => (
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
                  <td style={{ fontSize: '12px' }}>{report.dateRange}</td>
                  <td style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{report.generatedAt}</td>
                  <td style={{ fontSize: '12px' }}>{report.generatedBy}</td>
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
                  <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{report.size}</td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                      {report.status === 'Ready' && (
                        <>
                          <button
                            className="it-btn it-btn-outline it-btn-sm"
                            onClick={() => console.log(`Downloading PDF: ${report.id}`)}
                            title="Download PDF"
                            style={{ padding: '4px 10px', fontSize: '11px' }}
                          >
                            <Download size={11} /> PDF
                          </button>
                          <button
                            className="it-btn it-btn-outline it-btn-sm"
                            onClick={() => console.log(`Downloading CSV: ${report.id}`)}
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
                          onClick={() => console.log(`Retrying: ${report.id}`)}
                          style={{ padding: '4px 10px', fontSize: '11px' }}
                        >
                          <RefreshCw size={11} /> Retry
                        </button>
                      )}
                      {report.status === 'Processing' && (
                        <button
                          className="it-btn it-btn-ghost it-btn-sm"
                          style={{ padding: '4px 10px', fontSize: '11px', opacity: 0.5, cursor: 'default' }}
                          disabled
                        >
                          <Loader size={11} /> In Progress
                        </button>
                      )}
                      <button
                        className="it-btn it-btn-ghost it-btn-sm"
                        style={{ padding: '4px 8px' }}
                        onClick={() => console.log(`Viewing: ${report.id}`)}
                        title="View Details"
                      >
                        <Eye size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

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
