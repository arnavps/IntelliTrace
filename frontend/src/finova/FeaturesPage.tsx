/* Features Page */
const featureCards = [
  {
    icon: '📊',
    title: 'Real-Time Analytics',
    desc: 'Monitor your financial performance with live dashboards, custom KPIs, and automated trend detection.',
    tags: ['Dashboard', 'Live Data', 'KPIs'],
  },
  {
    icon: '🔄',
    title: 'Automated Categorization',
    desc: 'AI-powered expense tracking automatically categorizes every transaction, saving you hours every month.',
    tags: ['AI', 'Automation', 'Expenses'],
  },
  {
    icon: '🏦',
    title: 'Multi-Account Management',
    desc: 'Connect and manage all your bank accounts, credit cards, and investment portfolios in one place.',
    tags: ['Accounts', 'Banks', 'Portfolio'],
  },
  {
    icon: '📋',
    title: 'Smart Budget Planning',
    desc: 'Set budgets, get alerts when you are close to limits, and receive AI-recommended savings plans.',
    tags: ['Budget', 'Alerts', 'Planning'],
  },
  {
    icon: '🛡',
    title: 'Bank-Grade Security',
    desc: '256-bit AES encryption, two-factor authentication, and SOC 2 Type II compliance protect your data.',
    tags: ['Security', 'Encryption', 'SOC 2'],
  },
  {
    icon: '📤',
    title: 'Export & Reports',
    desc: 'Generate professional financial reports and export them in PDF, CSV, or Excel formats instantly.',
    tags: ['Reports', 'PDF', 'Export'],
  },
  {
    icon: '🌐',
    title: 'Global Currency Support',
    desc: 'Track transactions in 150+ currencies with live exchange rates and automatic conversion.',
    tags: ['Currency', 'Global', 'FX Rates'],
  },
  {
    icon: '🔔',
    title: 'Smart Notifications',
    desc: 'Get instant alerts on unusual spending, upcoming bills, budget overruns, and investment milestones.',
    tags: ['Alerts', 'Notifications', 'Bills'],
  },
  {
    icon: '📱',
    title: 'Mobile First',
    desc: 'Full-featured iOS and Android apps with biometric login, widgets, and offline capability.',
    tags: ['Mobile', 'iOS', 'Android'],
  },
]

export function FeaturesPage({ onNavigate }: { onNavigate: (p: string) => void }) {
  return (
    <div>
      {/* Page Hero */}
      <section className="fn-page-hero">
        <div className="fn-container">
          <div className="fn-badge" style={{ display: 'inline-flex', marginBottom: '16px' }}>🚀 Smart Finance</div>
          <h1 className="fn-heading-hero" style={{ marginBottom: '16px' }}>
            Powerful Features for<br />
            <span style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic' }}>Every Need</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '16px', maxWidth: '520px', margin: '0 auto 32px', lineHeight: 1.6 }}>
            Everything you need to manage, analyze, and grow your finances — all in one intelligent platform.
          </p>
          <button className="fn-btn fn-btn-primary" onClick={() => onNavigate('Signup')}>Start Free Trial ↗</button>
        </div>
      </section>

      {/* Stats Bar */}
      <section style={{ background: 'var(--bg-dark)', padding: '40px 0', borderBottom: '1px solid var(--border-subtle)' }}>
        <div className="fn-container">
          <div className="fn-stats-row">
            {[
              { v: '50M+', l: 'Active Users Worldwide' },
              { v: '4.9★', l: 'Average App Rating' },
              { v: '120+', l: 'Countries Served' },
              { v: '99.9%', l: 'Uptime SLA' },
            ].map(s => (
              <div key={s.l} className="fn-stat-item" style={{ textAlign: 'center' }}>
                <div className="fn-stat-value" style={{ color: 'var(--primary)' }}>{s.v}</div>
                <div className="fn-stat-label">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Cards */}
      <section className="fn-section">
        <div className="fn-container">
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '24px',
          }}>
            {featureCards.map(card => (
              <div key={card.title} className="fn-card" style={{ padding: '28px' }}>
                <div className="fn-feature-icon" style={{ fontSize: '24px', width: '48px', height: '48px' }}>{card.icon}</div>
                <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '10px', color: 'var(--text-primary)' }}>{card.title}</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '16px' }}>{card.desc}</p>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {card.tags.map(tag => <span key={tag} className="fn-tag">{tag}</span>)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: 'var(--bg-dark)', padding: '80px 0', textAlign: 'center', borderTop: '1px solid var(--border-subtle)' }}>
        <div className="fn-container">
          <h2 className="fn-heading-section" style={{ marginBottom: '16px' }}>
            Ready to Get Started?
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '32px', fontSize: '16px' }}>
            Join 50 million users already managing their finances smarter.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="fn-btn fn-btn-primary" onClick={() => onNavigate('Signup')}>Start Free Trial ↗</button>
            <button className="fn-btn fn-btn-outline" onClick={() => onNavigate('Pricing')}>View Pricing ↗</button>
          </div>
        </div>
      </section>
    </div>
  )
}
