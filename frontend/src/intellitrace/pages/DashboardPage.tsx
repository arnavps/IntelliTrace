import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Activity,
  AlertTriangle,
  ShieldAlert,
  TrendingUp,
  FileText,
  Search,
  GitBranch,
  ClipboardList,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import '../styles/dashboard.css'
import { useApi, getUser } from '../../hooks/useApi'

/* ─── API Response Type ─────────────────────────────────────────── */

interface DashboardStats {
  total_transactions: number
  open_alerts: number
  critical_cases: number
  avg_risk_score: number
  risk_distribution: { name: string; value: number }[]
  fraud_trend: { day: string; Alerts: number; Cases: number }[]
  activity_feed: {
    id: string
    alert_type: string
    account_id: string
    amount: string
    risk: string
    time: string
  }[]
}

/* ─── Risk Colors ───────────────────────────────────────────────── */

const RISK_COLORS: Record<string, string> = {
  Critical: '#EF4444',
  High:     '#F97316',
  Medium:   '#EAB308',
  Low:      '#22C55E',
  critical: '#EF4444',
  high:     '#F97316',
  medium:   '#EAB308',
  low:      '#22C55E',
}

/* ─── Loading Skeleton ───────────────────────────────────────────── */

function SkeletonBox({ width = '100%', height = 20, radius = 8, style = {} }: {
  width?: string | number
  height?: number
  radius?: number
  style?: React.CSSProperties
}) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius: radius,
        background: 'linear-gradient(90deg, #1e1e1e 25%, #2a2a2a 50%, #1e1e1e 75%)',
        backgroundSize: '200% 100%',
        animation: 'it-skeleton-pulse 1.5s ease-in-out infinite',
        ...style,
      }}
    />
  )
}

/* ─── Stat Card ─────────────────────────────────────────────────── */

interface StatCardProps {
  title: string
  value: string
  delta: string
  deltaUp?: boolean
  icon: React.ReactNode
  iconBg: string
}

function StatCard({ title, value, delta, deltaUp = true, icon, iconBg }: StatCardProps) {
  return (
    <div
      className="it-card"
      style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 12 }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p className="it-card-title" style={{ marginBottom: 6 }}>{title}</p>
          <p className="it-card-value">{value}</p>
          <p
            className="it-card-delta"
            style={{ color: deltaUp ? '#22C55E' : '#EF4444', display: 'flex', alignItems: 'center', gap: 4, marginTop: 6 }}
          >
            {deltaUp
              ? <ArrowUpRight size={13} />
              : <ArrowDownRight size={13} />}
            {delta}
          </p>
        </div>
        <div
          className="it-stat-icon"
          style={{ background: iconBg }}
        >
          {icon}
        </div>
      </div>
    </div>
  )
}

function StatCardSkeleton() {
  return (
    <div className="it-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
          <SkeletonBox width={100} height={13} />
          <SkeletonBox width={70} height={28} />
          <SkeletonBox width={120} height={12} />
        </div>
        <SkeletonBox width={40} height={40} radius={10} />
      </div>
    </div>
  )
}

/* ─── Custom Tooltip for LineChart ──────────────────────────────── */

function CustomTooltip({ active, payload, label }: {
  active?: boolean
  payload?: { name: string; value: number; color: string }[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: '#1A1A1A', border: '1px solid #2A2A2A',
      borderRadius: 10, padding: '10px 14px', fontSize: 12,
    }}>
      <p style={{ color: '#999', marginBottom: 6, fontWeight: 600 }}>{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color, fontWeight: 500 }}>
          {p.name}: <span style={{ color: '#fff' }}>{p.value}</span>
        </p>
      ))}
    </div>
  )
}

/* ─── Page ──────────────────────────────────────────────────────── */

export function DashboardPage() {
  const navigate = useNavigate()
  const [userName, setUserName] = useState('User')

  useEffect(() => {
    const user = getUser()
    if (user?.name) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setUserName(user.name.split(' ')[0])
    }
  }, [])

  const { data, loading, error } = useApi<DashboardStats>('/api/dashboard/stats')

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })

  /* ── Derived display values ─────────────────────────────────── */
  const totalTxns   = data ? data.total_transactions.toLocaleString('en-IN') : '—'
  const openAlerts  = data ? String(data.open_alerts) : '—'
  const critCases   = data ? String(data.critical_cases) : '—'
  const avgRisk     = data ? data.avg_risk_score.toFixed(2) : '—'

  /* Risk distribution with color injected */
  const riskDist = (data?.risk_distribution ?? []).map((item) => ({
    ...item,
    color: RISK_COLORS[item.name] ?? '#888',
  }))

  const fraudTrend   = data?.fraud_trend    ?? []
  const activityFeed = data?.activity_feed  ?? []

  return (
    <div className="it-content it-fade-in" style={{ maxWidth: 1400 }}>

      {/* ── Page Header ──────────────────────────────────────────── */}
      <div className="it-page-header" style={{ marginBottom: 28 }}>
        <div>
          <h1 className="it-page-heading">Dashboard</h1>
          <p className="it-page-subheading">Good morning, {userName} &nbsp;·&nbsp; {today}</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="it-btn it-btn-outline it-btn-sm" onClick={() => navigate('/reports')}>
            <FileText size={14} /> Generate Report
          </button>
          <button className="it-btn it-btn-primary it-btn-sm" onClick={() => navigate('/alerts')}>
            <AlertTriangle size={14} /> View All Alerts
          </button>
        </div>
      </div>

      {/* ── Error Banner ─────────────────────────────────────────── */}
      {error && (
        <div style={{
          background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: 10, padding: '10px 16px', marginBottom: 20,
          color: '#F87171', fontSize: 13,
        }}>
          ⚠ Failed to load dashboard data: {error}
        </div>
      )}

      {/* ── Stat Grid ────────────────────────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 16,
          marginBottom: 24,
        }}
      >
        {loading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <StatCard
              title="Total Transactions"
              value={totalTxns}
              delta="+12.4% vs yesterday"
              deltaUp
              icon={<Activity size={18} color="#F5A623" />}
              iconBg="rgba(245,166,35,0.15)"
            />
            <StatCard
              title="Fraud Alerts"
              value={openAlerts}
              delta="Open alerts today"
              deltaUp={false}
              icon={<AlertTriangle size={18} color="#EF4444" />}
              iconBg="rgba(239,68,68,0.15)"
            />
            <StatCard
              title="Critical Cases"
              value={critCases}
              delta="Pending review"
              deltaUp={false}
              icon={<ShieldAlert size={18} color="#F97316" />}
              iconBg="rgba(249,115,22,0.15)"
            />
            <StatCard
              title="Risk Score Avg"
              value={avgRisk}
              delta="High risk threshold"
              deltaUp={false}
              icon={<TrendingUp size={18} color="#EAB308" />}
              iconBg="rgba(234,179,8,0.15)"
            />
          </>
        )}
      </div>

      {/* ── Row 2: Charts ─────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 24 }}>

        {/* Fraud Trends */}
        <div className="it-card" style={{ padding: 20 }}>
          <div className="it-card-header">
            <p className="it-card-title">Fraud Trends — Last 7 Days</p>
            <span className="it-badge it-badge-accent">Weekly</span>
          </div>
          {loading ? (
            <div style={{ marginTop: 16 }}>
              <SkeletonBox height={220} radius={10} />
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={fraudTrend} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                  <XAxis dataKey="day" tick={{ fill: '#666', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#666', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone" dataKey="Alerts"
                    stroke="#F5A623" strokeWidth={2.5}
                    dot={{ fill: '#F5A623', strokeWidth: 0, r: 3 }}
                    activeDot={{ r: 5, fill: '#F5A623' }}
                  />
                  <Line
                    type="monotone" dataKey="Cases"
                    stroke="#EF4444" strokeWidth={2.5}
                    dot={{ fill: '#EF4444', strokeWidth: 0, r: 3 }}
                    activeDot={{ r: 5, fill: '#EF4444' }}
                  />
                </LineChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', gap: 20, marginTop: 12, justifyContent: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#999' }}>
                  <span style={{ width: 24, height: 2, background: '#F5A623', borderRadius: 2, display: 'inline-block' }} />
                  Alerts
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#999' }}>
                  <span style={{ width: 24, height: 2, background: '#EF4444', borderRadius: 2, display: 'inline-block' }} />
                  Cases
                </div>
              </div>
            </>
          )}
        </div>

        {/* Risk Distribution */}
        <div className="it-card" style={{ padding: 20 }}>
          <div className="it-card-header">
            <p className="it-card-title">Risk Distribution</p>
            <span className="it-badge it-badge-neutral">Today</span>
          </div>
          {loading ? (
            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <SkeletonBox height={160} radius={10} />
              <SkeletonBox height={14} width="80%" />
              <SkeletonBox height={14} width="70%" />
              <SkeletonBox height={14} width="75%" />
              <SkeletonBox height={14} width="65%" />
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={riskDist}
                    cx="50%" cy="50%"
                    innerRadius={48}
                    outerRadius={72}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {riskDist.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    formatter={(value: any, name: any) => [`${value}%`, name]}
                    contentStyle={{ background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 8, fontSize: 12 }}
                    itemStyle={{ color: '#fff' }}
                    labelStyle={{ color: '#999' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                {riskDist.map((item) => (
                  <div key={item.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: item.color, flexShrink: 0 }} />
                      <span style={{ fontSize: 12, color: '#999' }}>{item.name}</span>
                    </div>
                    <span style={{ fontSize: 12, color: '#fff', fontWeight: 600 }}>{item.value}%</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Row 3: Activity + Quick Actions ───────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16 }}>

        {/* Activity Feed */}
        <div className="it-card" style={{ padding: 20 }}>
          <div className="it-card-header" style={{ marginBottom: 16 }}>
            <p className="it-card-title">Today's Activity</p>
            <Link to="/alerts" style={{ fontSize: 12, color: '#F5A623', textDecoration: 'none', fontWeight: 500 }}>
              View all →
            </Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, maxHeight: 320, overflowY: 'auto' }}>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} style={{ padding: '11px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center', flex: 1 }}>
                    <SkeletonBox width={8} height={8} radius={99} style={{ flexShrink: 0 }} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, flex: 1 }}>
                      <SkeletonBox width="60%" height={13} />
                      <SkeletonBox width="40%" height={11} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5, alignItems: 'flex-end' }}>
                    <SkeletonBox width={70} height={13} />
                    <SkeletonBox width={50} height={11} />
                  </div>
                </div>
              ))
            ) : activityFeed.length === 0 ? (
              <p style={{ color: '#555', fontSize: 13, padding: '20px 12px' }}>No recent activity.</p>
            ) : (
              activityFeed.map((item) => {
                const dotColor = RISK_COLORS[item.risk] ?? '#888'
                return (
                  <Link
                    key={item.id}
                    to={`/alerts/${item.id}`}
                    style={{ textDecoration: 'none' }}
                  >
                    <div
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '11px 12px', borderRadius: 10, cursor: 'pointer',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#222')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span
                          style={{
                            width: 8, height: 8, borderRadius: '50%',
                            background: dotColor,
                            flexShrink: 0,
                            boxShadow: `0 0 6px ${dotColor}66`,
                          }}
                        />
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 500, color: '#fff' }}>{item.alert_type}</p>
                          <p style={{ fontSize: 11, color: '#666', marginTop: 2 }}>
                            {item.account_id} &nbsp;·&nbsp; {item.id}
                          </p>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{item.amount}</p>
                        <p style={{ fontSize: 11, color: '#666', marginTop: 2 }}>{item.time}</p>
                      </div>
                    </div>
                  </Link>
                )
              })
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="it-card" style={{ padding: 20 }}>
          <p className="it-card-title" style={{ marginBottom: 18 }}>Quick Actions</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button
              className="it-btn it-btn-primary"
              style={{ width: '100%', justifyContent: 'flex-start', gap: 10 }}
              onClick={() => navigate('/reports')}
            >
              <FileText size={16} />
              Generate STR Report
            </button>
            <button
              className="it-btn it-btn-outline"
              style={{ width: '100%', justifyContent: 'flex-start', gap: 10 }}
              onClick={() => navigate('/cases')}
            >
              <ClipboardList size={16} />
              New Investigation
            </button>
            <button
              className="it-btn it-btn-outline"
              style={{ width: '100%', justifyContent: 'flex-start', gap: 10 }}
              onClick={() => navigate('/graph')}
            >
              <GitBranch size={16} />
              View Graph
            </button>
            <button
              className="it-btn it-btn-ghost"
              style={{ width: '100%', justifyContent: 'flex-start', gap: 10, border: '1px solid #2A2A2A' }}
              onClick={() => navigate('/alerts')}
            >
              <Search size={16} />
              Bulk Review
            </button>
          </div>

          {/* Mini stats */}
          <div style={{ marginTop: 24, padding: '14px 0 0', borderTop: '1px solid #2A2A2A' }}>
            <p className="it-card-title" style={{ marginBottom: 12 }}>System Health</p>
            {[
              { label: 'ML Model Accuracy', val: 97.3, color: '#22C55E' },
              { label: 'Alert Processing',  val: 89.1, color: '#F5A623' },
              { label: 'Data Freshness',    val: 99.8, color: '#22C55E' },
            ].map((metric) => (
              <div key={metric.label} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 5 }}>
                  <span style={{ color: '#999' }}>{metric.label}</span>
                  <span style={{ color: '#fff', fontWeight: 600 }}>{metric.val}%</span>
                </div>
                <div className="it-progress">
                  <div
                    className="it-progress-bar"
                    style={{ width: `${metric.val}%`, background: metric.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
