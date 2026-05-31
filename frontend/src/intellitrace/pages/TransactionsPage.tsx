import { useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  RefreshCw,
  Eye,
  ExternalLink,
  Activity,
} from 'lucide-react'
import '../styles/dashboard.css'
import { useApi } from '../../hooks/useApi'

/* ─── Types ─────────────────────────────────────────────────────── */

type Risk      = 'Critical' | 'High' | 'Medium' | 'Low'

interface Transaction {
  id: string
  sender_name: string
  sender_account: string
  receiver_name: string
  receiver_account: string
  amount_formatted: string
  channel: string
  risk_score: number
  risk_level: string
  status: string
  time: string
}

interface TransactionsResponse {
  transactions: Transaction[]
  total: number
  page: number
  limit: number
}

/* ─── Constants ─────────────────────────────────────────────────── */

const CHANNELS = ['UPI', 'NEFT', 'RTGS', 'IMPS', 'SWIFT']
const RISKS: Risk[] = ['Critical', 'High', 'Medium', 'Low']
const PAGE_LIMIT = 25

/* ─── Risk Badge ─────────────────────────────────────────────────── */

const riskStyles: Record<string, { bg: string; color: string; border: string }> = {
  Critical: { bg: 'rgba(239,68,68,0.15)',  color: '#F87171', border: 'rgba(239,68,68,0.3)'  },
  High:     { bg: 'rgba(249,115,22,0.15)', color: '#FB923C', border: 'rgba(249,115,22,0.3)' },
  Medium:   { bg: 'rgba(234,179,8,0.15)',  color: '#FDE047', border: 'rgba(234,179,8,0.3)'  },
  Low:      { bg: 'rgba(34,197,94,0.15)',  color: '#4ADE80', border: 'rgba(34,197,94,0.3)'  },
}

const statusStyles: Record<string, { bg: string; color: string; border: string }> = {
  Flagged:        { bg: 'rgba(239,68,68,0.12)',  color: '#F87171', border: 'rgba(239,68,68,0.25)'  },
  'Under Review': { bg: 'rgba(139,92,246,0.12)', color: '#A78BFA', border: 'rgba(139,92,246,0.25)' },
  Cleared:        { bg: 'rgba(34,197,94,0.12)',  color: '#4ADE80', border: 'rgba(34,197,94,0.25)'  },
  Processing:     { bg: 'rgba(245,166,35,0.12)', color: '#F5A623', border: 'rgba(245,166,35,0.25)' },
}

function RiskBadge({ risk }: { risk: string }) {
  const s = riskStyles[risk] ?? { bg: '#222', color: '#aaa', border: '#333' }
  return (
    <span style={{
      background: s.bg, color: s.color,
      border: `1px solid ${s.border}`,
      borderRadius: 99, padding: '2px 10px',
      fontSize: 11, fontWeight: 600,
      display: 'inline-block', whiteSpace: 'nowrap',
    }}>
      {risk}
    </span>
  )
}

function StatusBadge({ status }: { status: string }) {
  const s = statusStyles[status] ?? { bg: '#222', color: '#aaa', border: '#333' }
  return (
    <span style={{
      background: s.bg, color: s.color,
      border: `1px solid ${s.border}`,
      borderRadius: 99, padding: '2px 10px',
      fontSize: 11, fontWeight: 600,
      display: 'inline-block', whiteSpace: 'nowrap',
    }}>
      {status}
    </span>
  )
}

/* ─── Skeleton Row ───────────────────────────────────────────────── */

function SkeletonRow() {
  const cell = (w: string | number) => (
    <div style={{
      height: 14, borderRadius: 6, width: w,
      background: 'linear-gradient(90deg, #1e1e1e 25%, #2a2a2a 50%, #1e1e1e 75%)',
      backgroundSize: '200% 100%',
      animation: 'it-skeleton-pulse 1.5s ease-in-out infinite',
    }} />
  )
  return (
    <tr>
      <td>{cell(80)}</td>
      <td><div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>{cell(110)}{cell(70)}</div></td>
      <td><div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>{cell(110)}{cell(70)}</div></td>
      <td>{cell(70)}</td>
      <td>{cell(50)}</td>
      <td>{cell(60)}</td>
      <td>{cell(80)}</td>
      <td>{cell(55)}</td>
      <td><div style={{ display: 'flex', gap: 6 }}>{cell(30)}{cell(30)}</div></td>
    </tr>
  )
}

/* ─── Page ──────────────────────────────────────────────────────── */

export function TransactionsPage() {
  const navigate = useNavigate()

  const [search,        setSearch]        = useState('')
  const [channelFilter, setChannelFilter] = useState('All')
  const [riskFilter,    setRiskFilter]    = useState('All')
  const [dateRange,     setDateRange]     = useState('')
  const [page,          setPage]          = useState(1)

  /* Build query URL reactively */
  const [queryUrl, setQueryUrl] = useState(() => buildUrl(1, '', 'All', 'All', ''))

  function buildUrl(
    pg: number,
    srch: string,
    ch: string,
    risk: string,
    date: string,
  ): string {
    const params = new URLSearchParams()
    params.set('page',  String(pg))
    params.set('limit', String(PAGE_LIMIT))
    if (srch) params.set('search',  srch)
    if (ch   !== 'All') params.set('channel', ch)
    if (risk !== 'All') params.set('risk',    risk)
    if (date) params.set('date', date)
    return `/api/transactions?${params.toString()}`
  }

  /* Sync state → queryUrl */
  useEffect(() => {
    setQueryUrl(buildUrl(page, search, channelFilter, riskFilter, dateRange))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, channelFilter, riskFilter, dateRange])

  const { data, loading, refetch } = useApi<TransactionsResponse>(queryUrl, [queryUrl])

  const transactions: Transaction[] = data?.transactions ?? []
  const total: number               = data?.total        ?? 0
  const totalPages                  = Math.max(1, Math.ceil(total / PAGE_LIMIT))

  /* Refresh button */
  const handleRefresh = useCallback(() => {
    refetch()
  }, [refetch])

  /* Filter change helpers — reset page to 1 */
  const handleSearchChange = (v: string) => {
    setSearch(v)
    setPage(1)
  }
  const handleChannelChange = (v: string) => {
    setChannelFilter(v)
    setPage(1)
  }
  const handleRiskChange = (v: string) => {
    setRiskFilter(v)
    setPage(1)
  }
  const handleDateChange = (v: string) => {
    setDateRange(v)
    setPage(1)
  }

  /* Pagination window */
  const pageWindow = (() => {
    const pages: number[] = []
    const start = Math.max(1, page - 2)
    const end   = Math.min(totalPages, start + 4)
    for (let i = start; i <= end; i++) pages.push(i)
    return pages
  })()

  const inputStyle: React.CSSProperties = {
    background: '#1A1A1A', border: '1px solid #2A2A2A',
    borderRadius: 8, padding: '7px 12px',
    color: '#fff', fontSize: 13, outline: 'none',
    transition: 'border-color 0.15s',
  }

  return (
    <div className="it-content it-fade-in" style={{ maxWidth: 1600 }}>

      {/* ── Page Header ──────────────────────────────────────────── */}
      <div className="it-page-header" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div>
            <h1 className="it-page-heading" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              Transactions
              <span className="it-live-dot" style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em' }}>
                LIVE
              </span>
            </h1>
            <p className="it-page-subheading">Real-time transaction monitoring &amp; risk surveillance</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Activity size={14} style={{ color: '#22C55E' }} />
          <span style={{ fontSize: 12, color: '#22C55E', fontWeight: 600 }}>System operational</span>
        </div>
      </div>

      {/* ── Stats Strip ──────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
        {[
          { label: 'Loaded',   value: loading ? '…' : `${transactions.length} txns`, color: '#F5A623' },
          { label: 'Total DB', value: loading ? '…' : total.toLocaleString('en-IN'),  color: '#3B82F6' },
          { label: 'Page',     value: `${page} / ${totalPages}`,                       color: '#F97316' },
          { label: 'Limit',    value: String(PAGE_LIMIT),                              color: '#22C55E' },
        ].map((pill) => (
          <div
            key={pill.label}
            style={{
              background: '#1A1A1A', border: '1px solid #2A2A2A',
              borderRadius: 99, padding: '5px 14px',
              display: 'flex', alignItems: 'center', gap: 6,
              fontSize: 12,
            }}
          >
            <span style={{ color: '#666' }}>{pill.label}:</span>
            <span style={{ color: pill.color, fontWeight: 700 }}>{pill.value}</span>
          </div>
        ))}
      </div>

      {/* ── Toolbar ───────────────────────────────────────────────── */}
      <div className="it-toolbar" style={{ marginBottom: 16, gap: 10 }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: '1 1 220px', minWidth: 180 }}>
          <Search
            size={14}
            style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: '#666', pointerEvents: 'none' }}
          />
          <input
            type="text"
            placeholder="Search by ID, account, name…"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            style={{ ...inputStyle, width: '100%', paddingLeft: 32 }}
            onFocus={(e)  => (e.target.style.borderColor = '#F5A623')}
            onBlur={(e)   => (e.target.style.borderColor = '#2A2A2A')}
          />
        </div>

        {/* Channel filter */}
        <select
          value={channelFilter}
          onChange={(e) => handleChannelChange(e.target.value)}
          className="it-input it-select"
          style={{ width: 130, cursor: 'pointer' }}
        >
          <option value="All">All Channels</option>
          {CHANNELS.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>

        {/* Risk filter */}
        <select
          value={riskFilter}
          onChange={(e) => handleRiskChange(e.target.value)}
          className="it-input it-select"
          style={{ width: 130, cursor: 'pointer' }}
        >
          <option value="All">All Risk</option>
          {RISKS.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>

        {/* Date range */}
        <input
          type="date"
          value={dateRange}
          onChange={(e) => handleDateChange(e.target.value)}
          style={{ ...inputStyle, colorScheme: 'dark', cursor: 'pointer' }}
          onFocus={(e) => (e.target.style.borderColor = '#F5A623')}
          onBlur={(e)  => (e.target.style.borderColor = '#2A2A2A')}
        />

        {/* Refresh */}
        <button
          className="it-btn it-btn-outline it-btn-sm"
          onClick={handleRefresh}
          disabled={loading}
          title="Refresh data"
        >
          <RefreshCw size={14} className={loading ? 'it-spin' : ''} />
          {loading ? 'Loading…' : 'Refresh'}
        </button>
      </div>

      {/* ── Table ─────────────────────────────────────────────────── */}
      <div
        style={{
          background: '#1A1A1A', border: '1px solid #2A2A2A',
          borderRadius: 14, overflow: 'hidden',
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table className="it-table" style={{ minWidth: 1000 }}>
            <thead>
              <tr>
                {['Txn ID', 'Sender (Account)', 'Receiver (Account)', 'Amount', 'Channel', 'Risk Score', 'Status', 'Time', 'Actions'].map((col) => (
                  <th key={col}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '40px 0', color: '#555' }}>
                    No transactions match the current filters.
                  </td>
                </tr>
              ) : (
                transactions.map((txn) => {
                  const riskKey = txn.risk_level as Risk
                  const riskSty = riskStyles[riskKey] ?? { bg: '#222', color: '#aaa', border: '#333' }
                  return (
                    <tr key={txn.id}>
                      {/* Txn ID */}
                      <td>
                        <span
                          className="it-td-mono it-td-primary"
                          style={{ color: '#F5A623', cursor: 'pointer', fontSize: 12 }}
                          onClick={() => navigate(`/alerts/${txn.id}`)}
                        >
                          {txn.id}
                        </span>
                      </td>

                      {/* Sender */}
                      <td>
                        <p className="it-td-primary" style={{ fontSize: 13 }}>{txn.sender_name}</p>
                        <p style={{ fontSize: 11, color: '#555', fontFamily: 'monospace' }}>{txn.sender_account}</p>
                      </td>

                      {/* Receiver */}
                      <td>
                        <p className="it-td-primary" style={{ fontSize: 13 }}>{txn.receiver_name}</p>
                        <p style={{ fontSize: 11, color: '#555', fontFamily: 'monospace' }}>{txn.receiver_account}</p>
                      </td>

                      {/* Amount */}
                      <td>
                        <span style={{ color: '#fff', fontWeight: 600, fontSize: 13 }}>{txn.amount_formatted}</span>
                      </td>

                      {/* Channel */}
                      <td>
                        <span style={{
                          background: '#222', border: '1px solid #333',
                          borderRadius: 6, padding: '2px 9px',
                          fontSize: 11, fontWeight: 600, color: '#aaa',
                        }}>
                          {txn.channel}
                        </span>
                      </td>

                      {/* Risk Score */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{
                            width: 36, height: 4, borderRadius: 99,
                            background: '#2A2A2A', overflow: 'hidden',
                          }}>
                            <div style={{
                              height: '100%', borderRadius: 99,
                              width: `${txn.risk_score * 100}%`,
                              background: riskSty.color,
                            }} />
                          </div>
                          <span style={{ fontSize: 12, fontWeight: 600, color: riskSty.color }}>
                            {txn.risk_score.toFixed(2)}
                          </span>
                        </div>
                        <div style={{ marginTop: 4 }}>
                          <RiskBadge risk={riskKey} />
                        </div>
                      </td>

                      {/* Status */}
                      <td>
                        <StatusBadge status={txn.status} />
                      </td>

                      {/* Time */}
                      <td style={{ color: '#666', fontSize: 12 }}>{txn.time}</td>

                      {/* Actions */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <button
                            title="View alert detail"
                            onClick={() => navigate(`/alerts/${txn.id}`)}
                            style={{
                              width: 30, height: 30,
                              background: 'transparent', border: '1px solid #2A2A2A',
                              borderRadius: 7, cursor: 'pointer',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              color: '#666', transition: 'all 0.15s',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.borderColor = '#F5A623'
                              e.currentTarget.style.color = '#F5A623'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.borderColor = '#2A2A2A'
                              e.currentTarget.style.color = '#666'
                            }}
                          >
                            <Eye size={13} />
                          </button>
                          <button
                            title="Open in new tab"
                            onClick={() => window.open(`/alerts/${txn.id}`, '_blank')}
                            style={{
                              width: 30, height: 30,
                              background: 'transparent', border: '1px solid #2A2A2A',
                              borderRadius: 7, cursor: 'pointer',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              color: '#666', transition: 'all 0.15s',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.borderColor = '#3B82F6'
                              e.currentTarget.style.color = '#60A5FA'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.borderColor = '#2A2A2A'
                              e.currentTarget.style.color = '#666'
                            }}
                          >
                            <ExternalLink size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination Footer ───────────────────────────────────── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 16px', borderTop: '1px solid #1E1E1E',
          background: '#111',
        }}>
          <p style={{ fontSize: 12, color: '#555' }}>
            Showing <span style={{ color: '#999' }}>
              {total === 0 ? 0 : (page - 1) * PAGE_LIMIT + 1}–{Math.min(page * PAGE_LIMIT, total)}
            </span>{' '}
            of <span style={{ color: '#F5A623', fontWeight: 600 }}>{total.toLocaleString('en-IN')}</span> transactions
          </p>
          <div className="it-pagination">
            <button
              className="it-page-btn"
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              ‹
            </button>
            {pageWindow.map((n) => (
              <button
                key={n}
                className={`it-page-btn${page === n ? ' active' : ''}`}
                onClick={() => setPage(n)}
              >
                {n}
              </button>
            ))}
            {totalPages > pageWindow[pageWindow.length - 1] && (
              <>
                <span style={{ color: '#444', fontSize: 12, padding: '0 4px' }}>…</span>
                <button className="it-page-btn" onClick={() => setPage(totalPages)}>{totalPages}</button>
              </>
            )}
            <button
              className="it-page-btn"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              ›
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
