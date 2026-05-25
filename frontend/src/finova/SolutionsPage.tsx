/* Solutions Page */
const solutions = [
  {
    icon: '👤',
    title: 'Personal Finance',
    desc: 'Track spending, build savings habits, and reach your personal financial goals with intelligent budget tools.',
    benefits: ['Budget tracking', 'Savings goals', 'Spending insights', 'Bill reminders'],
  },
  {
    icon: '💼',
    title: 'Small Business',
    desc: 'Manage cash flow, track business expenses, generate invoices, and keep your finances organized.',
    benefits: ['Cash flow management', 'Invoice generation', 'Expense reports', 'Tax preparation'],
  },
  {
    icon: '🏢',
    title: 'Enterprise',
    desc: 'Scalable financial operations with team controls, audit trails, and compliance reporting for large organizations.',
    benefits: ['Team permissions', 'Audit trails', 'Compliance reports', 'API access'],
  },
  {
    icon: '📈',
    title: 'Investments',
    desc: 'Monitor portfolios, track returns, analyze risk, and get AI-powered insights on investment opportunities.',
    benefits: ['Portfolio tracking', 'Return analysis', 'Risk scoring', 'Market alerts'],
  },
  {
    icon: '🌍',
    title: 'International',
    desc: 'Manage multi-currency accounts, handle cross-border payments, and stay compliant across 120+ countries.',
    benefits: ['150+ currencies', 'FX conversion', 'SWIFT payments', 'Tax compliance'],
  },
  {
    icon: '🤝',
    title: 'Financial Advisors',
    desc: 'White-labeled dashboards, client portals, and reporting tools designed for financial advisory firms.',
    benefits: ['Client portals', 'White-label', 'Custom reports', 'Bulk management'],
  },
]

const comparisonRows = [
  { feature: 'Transaction tracking', personal: true, business: true, enterprise: true },
  { feature: 'Multi-account support', personal: '3 accounts', business: '10 accounts', enterprise: 'Unlimited' },
  { feature: 'Team members', personal: false, business: '5 users', enterprise: 'Unlimited' },
  { feature: 'API access', personal: false, business: false, enterprise: true },
  { feature: 'Custom reports', personal: false, business: true, enterprise: true },
  { feature: 'Audit logs', personal: false, business: false, enterprise: true },
  { feature: 'Priority support', personal: false, business: true, enterprise: true },
  { feature: 'SLA guarantee', personal: false, business: '99.5%', enterprise: '99.9%' },
]

export function SolutionsPage({ onNavigate }: { onNavigate: (p: string) => void }) {
  return (
    <div>
      {/* Hero */}
      <section className="fn-page-hero">
        <div className="fn-container">
          <div className="fn-badge" style={{ display: 'inline-flex', marginBottom: '16px' }}>🚀 Solutions</div>
          <h1 className="fn-heading-hero" style={{ marginBottom: '16px' }}>
            Finance Solutions for<br />
            <span style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic' }}>Every Scale</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '16px', maxWidth: '520px', margin: '0 auto' }}>
            Whether you are an individual, a startup, or an enterprise — IntelliTrace adapts to your financial complexity.
          </p>
        </div>
      </section>

      {/* Solution cards */}
      <section className="fn-section">
        <div className="fn-container">
          <div className="fn-solutions-grid">
            {solutions.map(s => (
              <div key={s.title} className="fn-solution-card">
                <div className="fn-solution-icon">{s.icon}</div>
                <h3 className="fn-solution-title">{s.title}</h3>
                <p className="fn-solution-desc">{s.desc}</p>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {s.benefits.map(b => (
                    <li key={b} style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '13px', color: 'var(--text-secondary)' }}>
                      <span style={{ color: 'var(--primary)', fontWeight: 700 }}>✓</span> {b}
                    </li>
                  ))}
                </ul>
                <button className="fn-btn fn-btn-outline-solid" style={{ marginTop: '20px', width: '100%' }} onClick={() => onNavigate('Pricing')}>
                  Get Started ↗
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison table */}
      <section className="fn-section-dark">
        <div className="fn-container">
          <div className="fn-section-header">
            <h2 className="fn-heading-section">
              Compare <span className="serif-part">Plans</span>
            </h2>
            <p>Find the plan that's right for your scale and use case.</p>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '16px 0', textAlign: 'left', fontSize: '14px', color: 'var(--text-muted)', fontWeight: 500 }}>Feature</th>
                  {['Personal', 'Business', 'Enterprise'].map(h => (
                    <th key={h} style={{ padding: '16px', textAlign: 'center', fontSize: '14px', color: 'var(--text-primary)', fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map(row => (
                  <tr key={row.feature} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '14px 0', fontSize: '14px', color: 'var(--text-secondary)' }}>{row.feature}</td>
                    {[row.personal, row.business, row.enterprise].map((val, i) => (
                      <td key={i} style={{ padding: '14px', textAlign: 'center', fontSize: '13px' }}>
                        {val === true ? <span style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '16px' }}>✓</span>
                          : val === false ? <span style={{ color: 'var(--text-muted)' }}>—</span>
                          : <span style={{ color: 'var(--text-secondary)' }}>{val}</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ textAlign: 'center', marginTop: '40px' }}>
            <button className="fn-btn fn-btn-primary" onClick={() => onNavigate('Pricing')}>View Full Pricing ↗</button>
          </div>
        </div>
      </section>
    </div>
  )
}
