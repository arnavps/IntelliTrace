import { useState } from 'react'

const metrics = [
  { icon: '💰', label: 'Total Revenue', value: '$98,343', change: '+18.5%', up: true },
  { icon: '📊', label: 'Monthly Expenses', value: '$24,560', change: '-3.2%', up: false },
  { icon: '💹', label: 'Net Savings', value: '$73,783', change: '+24.1%', up: true },
  { icon: '🎯', label: 'Budget Utilized', value: '68%', change: '+2%', up: true },
]

const recentTx = [
  { date: 'May 24', desc: 'Amazon Prime', cat: 'Subscription', amount: '-$14.99', type: 'neg' },
  { date: 'May 23', desc: 'Salary Deposit', cat: 'Income', amount: '+$8,500.00', type: 'pos' },
  { date: 'May 22', desc: 'Netflix', cat: 'Entertainment', amount: '-$17.99', type: 'neg' },
  { date: 'May 21', desc: 'Grocery Store', cat: 'Food', amount: '-$124.50', type: 'neg' },
  { date: 'May 20', desc: 'Freelance Invoice', cat: 'Income', amount: '+$2,400.00', type: 'pos' },
  { date: 'May 19', desc: 'Utility Bill', cat: 'Housing', amount: '-$89.00', type: 'neg' },
  { date: 'May 18', desc: 'Coffee Shop', cat: 'Food', amount: '-$6.80', type: 'neg' },
]

// Months for chart
const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const revenueData = [42, 68, 55, 82, 78, 94, 88, 100, 92, 86, 90, 98]
const expenseData  = [28, 35, 40, 38, 45, 42, 39, 44, 40, 38, 36, 42]

const categorySpend = [
  { cat: 'Housing', pct: 35, amount: '$1,540' },
  { cat: 'Food & Dining', pct: 22, amount: '$968' },
  { cat: 'Transportation', pct: 14, amount: '$616' },
  { cat: 'Entertainment', pct: 10, amount: '$440' },
  { cat: 'Subscriptions', pct: 8, amount: '$352' },
  { cat: 'Other', pct: 11, amount: '$484' },
]

const catColors = ['#F5A623', '#2196F3', '#4CAF50', '#9C27B0', '#E91E63', '#607D8B']

export function AnalyticsPage({ onNavigate }: { onNavigate: (p: string) => void }) {
  const [activeRange, setActiveRange] = useState('12M')
  const ranges = ['1M', '3M', '6M', '12M', 'All']

  // Max for normalization
  const maxRev = Math.max(...revenueData)

  return (
    <div>
      {/* Hero */}
      <section className="fn-page-hero">
        <div className="fn-container">
          <div className="fn-badge" style={{ display: 'inline-flex', marginBottom: '16px' }}>📊 Analytics</div>
          <h1 className="fn-heading-hero" style={{ marginBottom: '16px' }}>
            Your Financial<br />
            <span style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic' }}>Performance Overview</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '16px', maxWidth: '460px', margin: '0 auto 32px' }}>
            Deep-dive into your financial metrics, trends, and performance indicators in real time.
          </p>
          <button className="fn-btn fn-btn-primary" onClick={() => onNavigate('Signup')}>Connect Your Accounts ↗</button>
        </div>
      </section>

      {/* Dashboard Preview */}
      <section className="fn-section">
        <div className="fn-container">
          {/* Metric cards */}
          <div className="fn-analytics-grid">
            {metrics.map(m => (
              <div key={m.label} className="fn-metric-card">
                <div className="fn-metric-icon">{m.icon}</div>
                <div className="fn-metric-value">{m.value}</div>
                <div className="fn-metric-label">{m.label}</div>
                <div className={`fn-metric-change ${m.up ? 'up' : 'down'}`}>
                  {m.up ? '↑' : '↓'} {m.change} vs last month
                </div>
              </div>
            ))}
          </div>

          {/* Revenue vs Expenses Chart */}
          <div className="fn-area-chart-wrap">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
              <div>
                <div className="fn-area-chart-title">Revenue vs Expenses</div>
                <div className="fn-area-chart-sub">12-month financial overview · Updated daily</div>
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                {ranges.map(r => (
                  <button key={r} onClick={() => setActiveRange(r)} style={{
                    padding: '4px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    border: activeRange === r ? '1px solid var(--border-accent)' : '1px solid var(--border)',
                    background: activeRange === r ? 'rgba(245,166,35,0.1)' : 'transparent',
                    color: activeRange === r ? 'var(--primary)' : 'var(--text-muted)',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    transition: 'all 0.2s ease',
                  }}>{r}</button>
                ))}
              </div>
            </div>

            {/* SVG Chart */}
            <div className="fn-area-chart">
              <svg viewBox="0 0 800 200" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#F5A623" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#F5A623" stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2196F3" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#2196F3" stopOpacity="0" />
                  </linearGradient>
                </defs>

                {/* Revenue area */}
                <path
                  d={`M ${revenueData.map((v, i) => `${(i / 11) * 800},${200 - (v / maxRev) * 180}`).join(' L ')} L 800,200 L 0,200 Z`}
                  fill="url(#revGrad)"
                />
                <polyline
                  points={revenueData.map((v, i) => `${(i / 11) * 800},${200 - (v / maxRev) * 180}`).join(' ')}
                  fill="none"
                  stroke="#F5A623"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Expense area */}
                <path
                  d={`M ${expenseData.map((v, i) => `${(i / 11) * 800},${200 - (v / maxRev) * 180}`).join(' L ')} L 800,200 L 0,200 Z`}
                  fill="url(#expGrad)"
                />
                <polyline
                  points={expenseData.map((v, i) => `${(i / 11) * 800},${200 - (v / maxRev) * 180}`).join(' ')}
                  fill="none"
                  stroke="#2196F3"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray="4 2"
                />
              </svg>
            </div>

            {/* Month labels */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
              {months.map(m => <span key={m} style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{m}</span>)}
            </div>

            {/* Legend */}
            <div style={{ display: 'flex', gap: '20px', marginTop: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                <div style={{ width: '12px', height: '2px', background: '#F5A623', borderRadius: '1px' }} /> Revenue
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                <div style={{ width: '12px', height: '2px', background: '#2196F3', borderRadius: '1px', borderBottom: '1px dashed' }} /> Expenses
              </div>
            </div>
          </div>

          {/* Bottom row: Spending categories + Recent transactions */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: '24px' }}>
            {/* Spending categories */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', padding: '24px' }}>
              <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px' }}>Spending by Category</div>
              {categorySpend.map((c, i) => (
                <div key={c.cat} style={{ marginBottom: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: catColors[i], display: 'inline-block' }} />
                      {c.cat}
                    </span>
                    <span style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 500 }}>{c.amount} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({c.pct}%)</span></span>
                  </div>
                  <div className="fn-progress">
                    <div className="fn-progress-fill" style={{ width: `${c.pct}%`, background: catColors[i] }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Recent transactions */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <span style={{ fontSize: '16px', fontWeight: 600 }}>Recent Transactions</span>
                <button className="fn-btn" style={{ fontSize: '12px', color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', padding: '0' }}>View All →</button>
              </div>
              {recentTx.map(tx => (
                <div key={tx.desc + tx.date} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                  <div style={{ width: '36px', height: '36px', background: 'var(--bg-elevated)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0 }}>
                    {tx.type === 'pos' ? '💰' : '💳'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>{tx.desc}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{tx.cat} · {tx.date}</div>
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: tx.type === 'pos' ? '#4CAF50' : '#ef5350' }}>{tx.amount}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: '48px' }}>
            <p style={{ fontSize: '16px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              This is a live preview. Connect your accounts to see your real data.
            </p>
            <button className="fn-btn fn-btn-primary" onClick={() => onNavigate('Signup')}>Connect My Accounts ↗</button>
          </div>
        </div>
      </section>
    </div>
  )
}
