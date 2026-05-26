import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  RefreshCw,
  Eye,
  ExternalLink,
  Activity,
} from 'lucide-react'
import '../styles/dashboard.css'

/* ─── Types ─────────────────────────────────────────────────────── */

type Risk    = 'Critical' | 'High' | 'Medium' | 'Low'
type Channel = 'UPI' | 'NEFT' | 'RTGS' | 'IMPS' | 'SWIFT'
type TxnStatus = 'Flagged' | 'Cleared' | 'Under Review' | 'Processing'

interface Transaction {
  id: string
  sender: string
  senderAcc: string
  receiver: string
  receiverAcc: string
  amount: string
  amountRaw: number
  channel: Channel
  riskScore: number
  risk: Risk
  status: TxnStatus
  time: string
  isNew?: boolean
}

/* ─── Mock Data Factory ─────────────────────────────────────────── */

const CHANNELS: Channel[]   = ['UPI', 'NEFT', 'RTGS', 'IMPS', 'SWIFT']
const RISKS: Risk[]         = ['Critical', 'High', 'Medium', 'Low']

const senderNames  = ['Arjun Sharma', 'Priya Mehta', 'Rajesh Iyer', 'Sunita Nair', 'Vikram Patel',
                      'Kavita Gupta', 'Suresh Kumar', 'Anita Singh', 'Deepak Joshi', 'Rekha Verma']
const receiverNames = ['Omega Traders Pvt', 'BrightPath Infra', 'Nexus Capital Ltd', 'Shiva Exports',
                       'Delta Finserv', 'Pinnacle Holdings', 'Falcon Logistics', 'Metro Ventures',
                       'Aurora Tech Corp', 'Vortex Solutions']

function formatINR(value: number): string {
  if (value >= 1_00_00_000) return `₹${(value / 1_00_00_000).toFixed(2)} Cr`
  if (value >= 1_00_000)   return `₹${(value / 1_00_000).toFixed(2)} L`
  return `₹${value.toLocaleString('en-IN')}`
}

function seedRand(seed: number) {
  let s = seed
  return () => { s = (s * 16807 + 0) % 2147483647; return (s - 1) / 2147483646 }
}

function generateMockTransactions(count: number): Transaction[] {
  const amounts = [
    280000, 4500000, 125000, 68000000, 9250000,
    310000, 1800000, 750000, 13500000, 500000,
    2200000, 87000, 45000000, 6700000, 3100000,
    190000, 22000000, 1100000, 4200000, 890000,
    16500000, 330000, 7800000, 2500000, 550000,
  ]

  const riskForScore = (score: number): Risk => {
    if (score >= 0.85) return 'Critical'
    if (score >= 0.65) return 'High'
    if (score >= 0.40) return 'Medium'
    return 'Low'
  }

  const times = [
    '10:42 AM', '10:38 AM', '10:31 AM', '10:27 AM', '10:18 AM',
    '10:09 AM', '09:55 AM', '09:48 AM', '09:40 AM', '09:33 AM',
    '09:21 AM', '09:12 AM', '09:04 AM', '08:57 AM', '08:49 AM',
    '08:41 AM', '08:33 AM', '08:22 AM', '08:14 AM', '08:07 AM',
    '07:59 AM', '07:51 AM', '07:44 AM', '07:38 AM', '07:30 AM',
  ]

  const scoreSeeds = [
    0.92, 0.87, 0.78, 0.71, 0.95,
    0.43, 0.61, 0.34, 0.88, 0.55,
    0.22, 0.79, 0.96, 0.68, 0.41,
    0.15, 0.83, 0.52, 0.73, 0.28,
    0.91, 0.37, 0.65, 0.48, 0.19,
  ]

  const statusMap: Record<Risk, TxnStatus[]> = {
    Critical:   ['Flagged', 'Under Review'],
    High:       ['Flagged', 'Under Review', 'Processing'],
    Medium:     ['Processing', 'Cleared', 'Under Review'],
    Low:        ['Cleared', 'Processing'],
  }

  return Array.from({ length: count }, (_, i) => {
    const idx       = i % amounts.length
    const amountRaw = amounts[idx]
    const score     = scoreSeeds[idx]
    const risk      = riskForScore(score)
    const sIdx      = i % senderNames.length
    const rIdx      = i % receiverNames.length
    const statuses  = statusMap[risk]
    const status    = statuses[i % statuses.length]

    return {
      id:          `TXN-${100291 - i}`,
      sender:      senderNames[sIdx],
      senderAcc:   `ACC-${4821 - i * 7}`,
      receiver:    receiverNames[rIdx],
      receiverAcc: `ACC-${9032 + i * 3}`,
      amount:      formatINR(amountRaw),
      amountRaw,
      channel:     CHANNELS[i % CHANNELS.length],
      riskScore:   Math.round(score * 100) / 100,
      risk,
      status,
      time:        times[idx],
    }
  })
}

const INITIAL_TRANSACTIONS = generateMockTransactions(25)

/* ─── Risk Badge ─────────────────────────────────────────────────── */

const riskStyles: Record<Risk, { bg: string; color: string; border: string }> = {
  Critical: { bg: 'rgba(239,68,68,0.15)',  color: '#F87171', border: 'rgba(239,68,68,0.3)'  },
  High:     { bg: 'rgba(249,115,22,0.15)', color: '#FB923C', border: 'rgba(249,115,22,0.3)' },
  Medium:   { bg: 'rgba(234,179,8,0.15)',  color: '#FDE047', border: 'rgba(234,179,8,0.3)'  },
  Low:      { bg: 'rgba(34,197,94,0.15)',  color: '#4ADE80', border: 'rgba(34,197,94,0.3)'  },
}

const statusStyles: Record<TxnStatus, { bg: string; color: string; border: string }> = {
  Flagged:       { bg: 'rgba(239,68,68,0.12)',  color: '#F87171', border: 'rgba(239,68,68,0.25)'  },
  'Under Review':{ bg: 'rgba(139,92,246,0.12)', color: '#A78BFA', border: 'rgba(139,92,246,0.25)' },
  Cleared:       { bg: 'rgba(34,197,94,0.12)',  color: '#4ADE80', border: 'rgba(34,197,94,0.25)'  },
  Processing:    { bg: 'rgba(245,166,35,0.12)', color: '#F5A623', border: 'rgba(245,166,35,0.25)' },
}

function RiskBadge({ risk }: { risk: Risk }) {
  const s = riskStyles[risk]
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

function StatusBadge({ status }: { status: TxnStatus }) {
  const s = statusStyles[status]
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

/* ─── Page ──────────────────────────────────────────────────────── */

export function TransactionsPage() {
  const navigate = useNavigate()

  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS)
  const [search,       setSearch]       = useState('')
  const [channelFilter,setChannelFilter]= useState<string>('All')
  const [riskFilter,   setRiskFilter]   = useState<string>('All')
  const [dateRange,    setDateRange]    = useState('')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [page,         setPage]         = useState(1)
  const [newRowId,     setNewRowId]     = useState<string | null>(null)

  /* Live ticker: inject a new row every ~12 s */
  useEffect(() => {
    const interval = setInterval(() => {
      const fakeRand = seedRand(Date.now() % 9999)
      const pick = <T,>(arr: T[]) => arr[Math.floor(fakeRand() * arr.length)]
      const score = Math.round((0.3 + fakeRand() * 0.7) * 100) / 100
      const risk: Risk = score >= 0.85 ? 'Critical' : score >= 0.65 ? 'High' : score >= 0.40 ? 'Medium' : 'Low'
      const amountRaw = Math.floor(fakeRand() * 5_00_00_000) + 50_000

      const newTxn: Transaction = {
        id:          `TXN-${100291 + Math.floor(fakeRand() * 9999)}`,
        sender:      senderNames[Math.floor(fakeRand() * senderNames.length)],
        senderAcc:   `ACC-${Math.floor(1000 + fakeRand() * 8000)}`,
        receiver:    receiverNames[Math.floor(fakeRand() * receiverNames.length)],
        receiverAcc: `ACC-${Math.floor(1000 + fakeRand() * 8000)}`,
        amount:      formatINR(amountRaw),
        amountRaw,
        channel:     pick(CHANNELS),
        riskScore:   score,
        risk,
        status:      risk === 'Critical' || risk === 'High' ? 'Flagged' : pick(['Cleared', 'Processing'] as TxnStatus[]),
        time:        new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        isNew:       true,
      }

      setNewRowId(newTxn.id)
      setTransactions((prev) => [newTxn, ...prev.slice(0, 24)])
      setTimeout(() => setNewRowId(null), 1500)
    }, 12000)

    return () => clearInterval(interval)
  }, [])

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true)
    setTimeout(() => {
      setTransactions(generateMockTransactions(25))
      setIsRefreshing(false)
    }, 800)
  }, [])

  /* Filtering */
  const filtered = transactions.filter((t) => {
    const matchSearch  = !search || [t.id, t.sender, t.receiver, t.senderAcc, t.receiverAcc]
      .some((v) => v.toLowerCase().includes(search.toLowerCase()))
    const matchChannel = channelFilter === 'All' || t.channel === channelFilter
    const matchRisk    = riskFilter    === 'All' || t.risk    === riskFilter
    return matchSearch && matchChannel && matchRisk
  })

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
              Live Transactions
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
          { label: 'Today', value: '12,847 txns', color: '#F5A623' },
          { label: 'Volume', value: '₹2.4B',       color: '#3B82F6' },
          { label: 'Flagged', value: '47',           color: '#EF4444' },
          { label: 'Avg Risk', value: '0.73',        color: '#F97316' },
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
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            style={{ ...inputStyle, width: '100%', paddingLeft: 32 }}
            onFocus={(e)  => (e.target.style.borderColor = '#F5A623')}
            onBlur={(e)   => (e.target.style.borderColor = '#2A2A2A')}
          />
        </div>

        {/* Channel filter */}
        <select
          value={channelFilter}
          onChange={(e) => { setChannelFilter(e.target.value); setPage(1) }}
          className="it-input it-select"
          style={{ width: 130, cursor: 'pointer' }}
        >
          <option value="All">All Channels</option>
          {CHANNELS.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>

        {/* Risk filter */}
        <select
          value={riskFilter}
          onChange={(e) => { setRiskFilter(e.target.value); setPage(1) }}
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
          onChange={(e) => setDateRange(e.target.value)}
          style={{ ...inputStyle, colorScheme: 'dark', cursor: 'pointer' }}
          onFocus={(e) => (e.target.style.borderColor = '#F5A623')}
          onBlur={(e)  => (e.target.style.borderColor = '#2A2A2A')}
        />

        {/* Refresh */}
        <button
          className="it-btn it-btn-outline it-btn-sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
          title="Refresh data"
        >
          <RefreshCw size={14} className={isRefreshing ? 'it-spin' : ''} />
          {isRefreshing ? 'Refreshing…' : 'Refresh'}
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
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '40px 0', color: '#555' }}>
                    No transactions match the current filters.
                  </td>
                </tr>
              ) : (
                filtered.map((txn) => (
                  <tr
                    key={txn.id}
                    style={{
                      transition: 'background 0.15s, opacity 0.4s, transform 0.4s',
                      opacity:    txn.id === newRowId ? 0.6 : 1,
                      transform:  txn.id === newRowId ? 'translateY(-4px)' : 'translateY(0)',
                      background: txn.id === newRowId ? 'rgba(245,166,35,0.04)' : undefined,
                    }}
                  >
                    {/* Txn ID */}
                    <td>
                      <span
                        className="it-td-mono it-td-primary"
                        style={{ color: '#F5A623', cursor: 'pointer', fontSize: 12 }}
                        onClick={() => navigate(`/alerts/${txn.id}`)}
                      >
                        {txn.id}
                        {txn.id === newRowId && (
                          <span style={{
                            marginLeft: 6, fontSize: 9, background: '#22C55E',
                            color: '#000', borderRadius: 4, padding: '1px 5px', fontWeight: 700,
                          }}>
                            NEW
                          </span>
                        )}
                      </span>
                    </td>

                    {/* Sender */}
                    <td>
                      <p className="it-td-primary" style={{ fontSize: 13 }}>{txn.sender}</p>
                      <p style={{ fontSize: 11, color: '#555', fontFamily: 'monospace' }}>{txn.senderAcc}</p>
                    </td>

                    {/* Receiver */}
                    <td>
                      <p className="it-td-primary" style={{ fontSize: 13 }}>{txn.receiver}</p>
                      <p style={{ fontSize: 11, color: '#555', fontFamily: 'monospace' }}>{txn.receiverAcc}</p>
                    </td>

                    {/* Amount */}
                    <td>
                      <span style={{ color: '#fff', fontWeight: 600, fontSize: 13 }}>{txn.amount}</span>
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
                            width: `${txn.riskScore * 100}%`,
                            background: riskStyles[txn.risk].color,
                          }} />
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 600, color: riskStyles[txn.risk].color }}>
                          {txn.riskScore.toFixed(2)}
                        </span>
                      </div>
                      <div style={{ marginTop: 4 }}>
                        <RiskBadge risk={txn.risk} />
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
                ))
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
            Showing <span style={{ color: '#999' }}>1–{Math.min(filtered.length, 25)}</span>{' '}
            of <span style={{ color: '#F5A623', fontWeight: 600 }}>1,284</span> transactions
            {search || channelFilter !== 'All' || riskFilter !== 'All'
              ? ` (${filtered.length} matching filter)`
              : ''}
          </p>
          <div className="it-pagination">
            <button
              className="it-page-btn"
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              ‹
            </button>
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                className={`it-page-btn${page === n ? ' active' : ''}`}
                onClick={() => setPage(n)}
              >
                {n}
              </button>
            ))}
            <span style={{ color: '#444', fontSize: 12, padding: '0 4px' }}>…</span>
            <button className="it-page-btn" onClick={() => setPage(52)}>52</button>
            <button
              className="it-page-btn"
              onClick={() => setPage((p) => p + 1)}
            >
              ›
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
