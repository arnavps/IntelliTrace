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

/* ─── Mock Data ─────────────────────────────────────────────────── */

const fraudTrendData = [
  { day: 'Mon', Alerts: 38, Cases: 8 },
  { day: 'Tue', Alerts: 52, Cases: 11 },
  { day: 'Wed', Alerts: 41, Cases: 9 },
  { day: 'Thu', Alerts: 63, Cases: 14 },
  { day: 'Fri', Alerts: 58, Cases: 12 },
  { day: 'Sat', Alerts: 29, Cases: 6 },
  { day: 'Sun', Alerts: 47, Cases: 10 },
]

const riskDistribution = [
  { name: 'Critical', value: 15, color: '#EF4444' },
  { name: 'High',     value: 25, color: '#F97316' },
  { name: 'Medium',   value: 35, color: '#EAB308' },
  { name: 'Low',      value: 25, color: '#22C55E' },
]

type RiskLevel = 'critical' | 'high' | 'medium' | 'low'

const activityFeed: {
  id: string
  alertType: string
  accountId: string
  amount: string
  time: string
  risk: RiskLevel
}[] = [
  { id: 'ALT-10291', alertType: 'Structuring Detected',       accountId: 'ACC-4821', amount: '₹14,50,000', time: '10:42 AM', risk: 'critical' },
  { id: 'ALT-10290', alertType: 'Velocity Breach',            accountId: 'ACC-3374', amount: '₹2,80,000',  time: '10:31 AM', risk: 'high'     },
  { id: 'ALT-10289', alertType: 'Unusual Cross-Border Txn',   accountId: 'ACC-7012', amount: '₹68,00,000', time: '10:18 AM', risk: 'critical' },
  { id: 'ALT-10288', alertType: 'Round-Trip Transaction',      accountId: 'ACC-5593', amount: '₹9,25,000',  time: '09:55 AM', risk: 'medium'   },
  { id: 'ALT-10287', alertType: 'Shell Entity Link',          accountId: 'ACC-2210', amount: '₹31,00,000', time: '09:40 AM', risk: 'high'     },
  { id: 'ALT-10286', alertType: 'Dormant Account Reactivated',accountId: 'ACC-8891', amount: '₹5,00,000',  time: '09:12 AM', risk: 'low'      },
]

const riskDotColor: Record<RiskLevel, string> = {
  critical: '#EF4444',
  high:     '#F97316',
  medium:   '#EAB308',
  low:      '#22C55E',
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
    const userStr = localStorage.getItem('user')
    if (userStr) {
      try {
        const user = JSON.parse(userStr)
        if (user.name) {
          const firstName = user.name.split(' ')[0]
          setUserName(firstName)
        }
      } catch (e) {
        console.error(e)
      }
    }
  }, [])

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })

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

      {/* ── Stat Grid ────────────────────────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 16,
          marginBottom: 24,
        }}
      >
        <StatCard
          title="Total Transactions"
          value="1,284,930"
          delta="+12.4% vs yesterday"
          deltaUp
          icon={<Activity size={18} color="#F5A623" />}
          iconBg="rgba(245,166,35,0.15)"
        />
        <StatCard
          title="Fraud Alerts"
          value="47"
          delta="+3 new today"
          deltaUp={false}
          icon={<AlertTriangle size={18} color="#EF4444" />}
          iconBg="rgba(239,68,68,0.15)"
        />
        <StatCard
          title="Critical Cases"
          value="12"
          delta="4 pending review"
          deltaUp={false}
          icon={<ShieldAlert size={18} color="#F97316" />}
          iconBg="rgba(249,115,22,0.15)"
        />
        <StatCard
          title="Risk Score Avg"
          value="0.73"
          delta="High risk threshold"
          deltaUp={false}
          icon={<TrendingUp size={18} color="#EAB308" />}
          iconBg="rgba(234,179,8,0.15)"
        />
      </div>

      {/* ── Row 2: Charts ─────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 24 }}>

        {/* Fraud Trends */}
        <div className="it-card" style={{ padding: 20 }}>
          <div className="it-card-header">
            <p className="it-card-title">Fraud Trends — Last 7 Days</p>
            <span className="it-badge it-badge-accent">Weekly</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={fraudTrendData} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
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
        </div>

        {/* Risk Distribution */}
        <div className="it-card" style={{ padding: 20 }}>
          <div className="it-card-header">
            <p className="it-card-title">Risk Distribution</p>
            <span className="it-badge it-badge-neutral">Today</span>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie
                data={riskDistribution}
                cx="50%" cy="50%"
                innerRadius={48}
                outerRadius={72}
                paddingAngle={3}
                dataKey="value"
                stroke="none"
              >
                {riskDistribution.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: any, name: any) => [`${value}%`, name]}
                contentStyle={{ background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 8, fontSize: 12 }}
                itemStyle={{ color: '#fff' }}
                labelStyle={{ color: '#999' }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
            {riskDistribution.map((item) => (
              <div key={item.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: item.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: '#999' }}>{item.name}</span>
                </div>
                <span style={{ fontSize: 12, color: '#fff', fontWeight: 600 }}>{item.value}%</span>
              </div>
            ))}
          </div>
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
            {activityFeed.map((item) => (
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
                        background: riskDotColor[item.risk],
                        flexShrink: 0,
                        boxShadow: `0 0 6px ${riskDotColor[item.risk]}66`,
                      }}
                    />
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 500, color: '#fff' }}>{item.alertType}</p>
                      <p style={{ fontSize: 11, color: '#666', marginTop: 2 }}>
                        {item.accountId} &nbsp;·&nbsp; {item.id}
                      </p>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{item.amount}</p>
                    <p style={{ fontSize: 11, color: '#666', marginTop: 2 }}>{item.time}</p>
                  </div>
                </div>
              </Link>
            ))}
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
