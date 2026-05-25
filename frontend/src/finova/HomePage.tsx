import { useState } from 'react'

/* ── Hero floating cards data ─── */
const txItems = [
  { icon: 'S', iconBg: '#1DB954', label: 'Spotify', amount: '-$15.99', type: 'neg' },
  { icon: 'P', iconBg: '#003087', label: 'PayPal Transfer', amount: '+$120.00', type: 'pos' },
  { icon: 'W', iconBg: '#7B1FA2', label: 'Wayflow Income', amount: '+$950.00', type: 'pos' },
]

const savingItems = [
  { icon: '⚡', label: 'Investment Goal', pct: '62%', amounts: '$15,800 / $25,000' },
  { icon: '🛡', label: 'Emergency Fund', pct: '60%', amounts: '$12,000 / $20,000' },
]

/* ── About logos ── */
const trustedLogos = ['Adobe', 'Framer', 'Notion', 'Amazon', 'Slack', 'Pendo', 'Trello']

/* ── How it works cards ── */
const hiwCards = [
  {
    id: 'wallet',
    title: 'Smart Wallet Overview',
    desc: 'Track balance, rewards, and transfers in one secure place.',
    content: (
      <div style={{ padding: '0 4px' }}>
        <div style={{ fontSize: '11px', fontWeight: 700, color: '#999', marginBottom: '8px' }}>IntelliTrace Cash Main Balance</div>
        <div style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '4px' }}>$ 1,389.00</div>
        <div style={{ fontSize: '10px', color: '#666', marginBottom: '12px' }}>Neopay ●●●●●● 5324 · ● 320 pts</div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <div style={{ flex: 1, background: 'rgba(255,255,255,0.06)', borderRadius: '6px', padding: '6px', textAlign: 'center', fontSize: '10px', color: '#ccc' }}>Transfer →</div>
          <div style={{ flex: 1, background: 'rgba(255,255,255,0.06)', borderRadius: '6px', padding: '6px', textAlign: 'center', fontSize: '10px', color: '#ccc' }}>Withdraw ●</div>
        </div>
      </div>
    ),
  },
  {
    id: 'insights',
    title: 'Financial Performance Insights',
    desc: 'Monitor trends and make smarter financial decisions.',
    content: (
      <div>
        <div style={{ fontSize: '11px', color: '#999', marginBottom: '8px' }}>Statistics · This Week</div>
        <svg viewBox="0 0 200 70" style={{ width: '100%', height: '70px' }}>
          <polyline points="0,55 30,35 60,45 90,20 120,30 150,15 180,25 200,18"
            fill="none" stroke="#F5A623" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <polyline points="0,65 30,50 60,58 90,42 120,52 150,38 180,48 200,40"
            fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    ),
  },
  {
    id: 'pricing-card',
    title: 'Flexible Pricing Plans',
    desc: 'Pick the right plan with clear, transparent pricing.',
    content: (
      <div>
        {[
          { dot: '#F5A623', label: 'Basic Package', price: '$48.00', desc: 'PDF 20+ file full access.' },
          { dot: '#555', label: 'VIP Package', price: '$89.00', desc: 'PDF 40+ file full access.' },
        ].map(p => (
          <div key={p.label} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', marginBottom: '10px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: p.dot, marginTop: '3px', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#fff' }}>{p.label} — {p.price}</div>
              <div style={{ fontSize: '10px', color: '#666' }}>{p.desc}</div>
            </div>
          </div>
        ))}
        <div style={{ background: '#fff', borderRadius: '6px', padding: '7px', textAlign: 'center', fontSize: '11px', fontWeight: 600, color: '#000', marginTop: '8px' }}>Pay $98.00</div>
      </div>
    ),
  },
]

/* ── Bar chart data ── */
const barData = [
  { month: 'Jan', val: '$18k', h: 40 },
  { month: 'Feb', val: '$42k', h: 80 },
  { month: 'Mar', val: '$31k', h: 60 },
  { month: 'Apr', val: '$50k', h: 100, active: true },
  { month: 'May', val: '$38k', h: 72 },
  { month: 'Jun', val: '$52k', h: 95 },
]

/* ── Invoice list ── */
const invoices = [
  { id: 'INV384', flag: '🇺🇸', country: 'United States', amount: '$1,500', badge: 'USD', badgeClass: 'usd' },
  { id: 'INV385', flag: '🇫🇷', country: 'France', amount: '€1,200', badge: 'EUR', badgeClass: 'eur' },
  { id: 'INV386', flag: '🇬🇧', country: 'United Kingdom', amount: '£900', badge: 'Pending', badgeClass: 'pending' },
  { id: 'INV387', flag: '🇨🇦', country: 'Canada', amount: '$1,050', badge: 'Completed', badgeClass: 'completed' },
]

/* ── Pricing ── */
const pricingPlans = [
  {
    id: 'starter',
    name: 'Starter Plan',
    desc: 'Perfect for individuals managing personal finances.',
    price: '$19',
    period: '/month',
    features: ['Track income and expenses', 'Smart budget planning tools', 'Basic financial reports', 'Secure cloud data storage', 'Email support'],
    ctaText: 'Get Started ↗',
    ctaClass: 'fn-btn-dark',
  },
  {
    id: 'pro',
    name: 'Pro Plan',
    badge: 'Best Value',
    desc: 'Advanced tools for professionals and growing teams.',
    priceOld: '$1,290',
    price: '$399',
    period: '/month',
    note: 'One-time payment',
    features: ['Everything in Starter', 'Advanced financial analytics', 'Automated expense categorization', 'Multi-account management', 'Export reports (PDF, CSV)', 'Priority customer support'],
    ctaText: 'Unlock Pro Features ↗',
    ctaClass: 'fn-btn-white-fill',
  },
]

/* ── FAQ ── */
const faqTabs = ['General', 'Implementation', 'Security & Compliance', 'Use Cases']
const faqItems = [
  { num: '{001}', q: 'What is this finance platform used for?', a: 'IntelliTrace is a next-generation finance platform designed to help individuals and businesses track, analyze, and optimize their financial performance in real time. It provides powerful dashboards, automated categorization, multi-account management, and intelligent insights.' },
  { num: '{002}', q: 'Can I connect multiple bank accounts?', a: 'Yes, you can securely connect multiple bank accounts, cards, and financial sources to view and manage all your finances from a single dashboard.', tags: ['Bank cards', 'Fintech', 'PayPal', 'Online Payment'] },
  { num: '{003}', q: 'How secure is my financial data?', a: 'We use bank-grade 256-bit AES encryption, two-factor authentication, and SOC 2 Type II compliance to ensure your data is always protected.' },
  { num: '{004}', q: 'Is there a free trial available?', a: 'Yes! You can start with a 14-day free trial. No credit card required. Explore all features and upgrade when you are ready.' },
  { num: '{005}', q: 'Can I export my financial reports?', a: 'Pro plan users can export reports in PDF, CSV, and Excel formats. All exports include your custom date ranges and filters.' },
]

/* ── Testimonials ── */
const testimonials = [
  {
    quote: ['Everything I need to ', 'manage my finances', ' is in one place,', ' which saves me', ' so much time.'],
    serifs: [false, true, false, true, false],
    attr: '— John Carter',
    photo: '/testimonial.png',
  },
  {
    quote: ['IntelliTrace transformed', ' how I think about money.', ' The analytics are', ' incredibly powerful', ' and easy to use.'],
    serifs: [true, false, false, true, false],
    attr: '— Robert H.',
    photo: '/testimonial.png',
  },
]

export function HomePage({ onNavigate }: { onNavigate: (p: string) => void }) {
  const [activeFaqTab, setActiveFaqTab] = useState('General')
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(1)
  const [testimonialIdx, setTestimonialIdx] = useState(0)

  const testimonial = testimonials[testimonialIdx]

  return (
    <div>
      {/* ═══════════════════════ HERO ═══════════════════════ */}
      <section id="home" className="fn-hero">
        <img src="/hero-bg.png" alt="Mountain landscape" className="fn-hero-bg-img" />
        <div className="fn-hero-bg" />

        <div className="fn-hero-content fn-animate-fadeup">
          <div className="fn-badge fn-delay-1 fn-animate-fadeup">🚀 Grow Your Wealth Faster</div>
          <h1 className="fn-heading-hero fn-delay-2 fn-animate-fadeup" style={{ marginBottom: '16px' }}>
            Next-Gen Finance for<br />
            <span style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic' }}>a Digital World</span>
          </h1>
          <p className="fn-hero-sub fn-delay-3 fn-animate-fadeup">
            Experience next-generation finance with powerful insights, automation, and real-time control.
          </p>
          <div className="fn-hero-actions fn-delay-4 fn-animate-fadeup">
            <button className="fn-btn fn-btn-primary" onClick={() => onNavigate('Signup')}>
              Start Free Trial ↗
            </button>
            <button className="fn-btn fn-btn-outline" onClick={() => onNavigate('Features')}>
              Learn More ↗
            </button>
          </div>
        </div>

        {/* Floating UI cards */}
        <div className="fn-hero-cards">
          {/* Left: Transaction History */}
          <div className="fn-floating-card left">
            <div className="fn-fc-header">
              Transaction History
              <span style={{ fontSize: '12px' }}>🔍</span>
            </div>
            {txItems.map(tx => (
              <div key={tx.label} className="fn-fc-tx-item">
                <div className="fn-fc-tx-icon" style={{ background: tx.iconBg }}>{tx.icon}</div>
                <span className="fn-fc-tx-label">{tx.label}</span>
                <span className={`fn-fc-tx-amount ${tx.type}`}>{tx.amount}</span>
              </div>
            ))}
          </div>

          {/* Center: Main phone */}
          <div className="fn-floating-card center">
            <div className="fn-fc-greeting">Good morning, Sajibur Rahman</div>
            <div className="fn-fc-balance-label">Total Balance</div>
            <div className="fn-fc-balance">$56,893.30</div>
            <div className="fn-fc-change">↑ +$3,456.00 · 18.5%</div>
            <div className="fn-fc-actions-row">
              <div className="fn-fc-action-btn">Deposit</div>
              <div className="fn-fc-action-btn">Transfer</div>
            </div>
            <div style={{ fontSize: '9px', color: 'var(--text-muted)', marginBottom: '6px' }}>Upcoming Payment — Pay Now</div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <div style={{ flex: 1, fontSize: '9px', color: '#fff', borderBottom: '1px solid var(--primary)', paddingBottom: '4px', textAlign: 'center' }}>Transactions</div>
              <div style={{ flex: 1, fontSize: '9px', color: 'var(--text-muted)', textAlign: 'center' }}>See More</div>
            </div>
          </div>

          {/* Right: Savings plan */}
          <div className="fn-floating-card right">
            <div className="fn-fc-header">My Savings Plan</div>
            {savingItems.map(s => (
              <div key={s.label} className="fn-fc-saving-item">
                <div className="fn-fc-saving-header">
                  <span style={{ fontSize: '11px' }}>{s.icon}</span>
                  <span className="fn-fc-saving-label">{s.label}</span>
                  <span className="fn-fc-saving-pct">{s.pct}</span>
                </div>
                <div className="fn-progress"><div className="fn-progress-fill" style={{ width: s.pct }} /></div>
                <div className="fn-fc-saving-amounts">{s.amounts}</div>
              </div>
            ))}
            <div style={{ textAlign: 'center', marginTop: '8px', fontSize: '10px', color: 'var(--primary)', border: '1px solid rgba(245,166,35,0.3)', borderRadius: '6px', padding: '5px' }}>+ Deposit</div>
          </div>
        </div>

        {/* Scroll hint */}
        <div className="fn-scroll-hint">
          <div className="fn-scroll-arrow">↓</div>
          <span>scroll</span>
        </div>
      </section>

      {/* ═══════════════════════ ABOUT ═══════════════════════ */}
      <section id="about" className="fn-about">
        <div className="fn-container">
          <div className="fn-about-meta">
            <span className="fn-about-meta-item">// About Us /</span>
            <span className="fn-about-meta-item" style={{ textAlign: 'center' }}>Clarity. Control. Confidence.</span>
            <div className="fn-about-meta-item" style={{ textAlign: 'right' }}>
              <div style={{ marginBottom: '4px' }}>© 2026</div>
              <div style={{ maxWidth: '200px' }}>Turn daily financial decisions into long term wealth with smarter tools.</div>
            </div>
          </div>

          <p className="fn-about-heading">
            We simplify finance with{' '}
            <strong>smart</strong> tools that help you manage,{' '}
            <strong>grow</strong>, and control your money.
            <span style={{ color: 'var(--text-muted)', fontWeight: 300 }}>{' '}Helping you manage money better with modern, intuitive financial solutions.</span>
          </p>

          <div className="fn-logos-row">
            <span className="fn-logos-label">Trusted by teams at</span>
            {trustedLogos.map(l => (
              <span key={l} className="fn-logo-item">{l}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════ HOW IT WORKS ═══════════════════════ */}
      <section id="how-it-works" className="fn-section-dark">
        <div className="fn-container">
          <div className="fn-section-header">
            <div className="fn-badge" style={{ justifyContent: 'center' }}>🚀 How it works</div>
            <h2 className="fn-heading-section">
              Simple Steps to <span className="serif-part">Smarter Finance</span>
            </h2>
            <p>Automate your financial operations, track performance in real time, and make confident decisions backed by clear insights.</p>
          </div>

          <div className="fn-hiw-grid">
            {hiwCards.map(card => (
              <div key={card.id} className="fn-hiw-card">
                <div className="fn-hiw-card-bg" />
                <div className="fn-hiw-card-overlay">
                  {card.content}
                </div>
                <div className="fn-hiw-card-bottom">
                  <p className="fn-hiw-card-title">{card.title}</p>
                  <p className="fn-hiw-card-desc">{card.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════ FEATURES ═══════════════════════ */}
      <section id="features" className="fn-section">
        <div className="fn-container">
          <div className="fn-features-grid">
            {/* Left column */}
            <div className="fn-feat-left">
              <div className="fn-badge">🚀 Smart Finance</div>
              <h2 className="fn-heading-section" style={{ marginBottom: '16px' }}>
                Take Control of Your<br />
                <span className="serif-part">Financial Future</span>
              </h2>
              <p className="fn-feat-desc">
                An all-in-one platform to track, analyze, and optimize your financial performance in real time.
              </p>

              {/* Stats */}
              <div className="fn-stats-row" style={{ marginBottom: '32px' }}>
                {[
                  { v: '50M+', l: 'Active Users' },
                  { v: '4.9', l: 'Average Rating' },
                  { v: '120+', l: 'Countries Served' },
                ].map(s => (
                  <div key={s.l} className="fn-stat-item">
                    <div className="fn-stat-value">{s.v}</div>
                    <div className="fn-stat-label">{s.l}</div>
                  </div>
                ))}
              </div>

              <button className="fn-btn fn-btn-outline-solid" onClick={() => onNavigate('Features')}>
                Explore Features ↗
              </button>
            </div>

            {/* Top right: Analysis chart */}
            <div className="fn-feat-top-right">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontSize: '16px', fontWeight: 600 }}>Analysis</span>
                <span style={{ fontSize: '14px', color: 'var(--text-muted)', cursor: 'pointer' }}>↗</span>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Earnings</div>
              <div style={{ fontSize: '24px', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '16px' }}>$98,343.23</div>

              <div className="fn-bar-chart">
                {barData.map(b => (
                  <div
                    key={b.month}
                    className={`fn-bar ${b.active ? 'active' : ''}`}
                    style={{ height: `${b.h}%` }}
                    data-val={b.val}
                    title={b.val}
                  />
                ))}
              </div>
              <div className="fn-bar-labels">
                {barData.map(b => (
                  <div key={b.month} className="fn-bar-label">{b.month}</div>
                ))}
              </div>
            </div>

            {/* Bottom left: Invoice list */}
            <div className="fn-feat-bottom-left">
              <div style={{ padding: '16px 16px 0', fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>📋</span> Invoice Payments
              </div>
              <div className="fn-invoice-list">
                {invoices.map(inv => (
                  <div key={inv.id} className="fn-invoice-item">
                    <span className="fn-invoice-flag">{inv.flag}</span>
                    <div style={{ flex: 1 }}>
                      <div className="fn-invoice-country">{inv.country}</div>
                      <div className="fn-invoice-id">{inv.id}</div>
                    </div>
                    <span className="fn-invoice-amount">{inv.amount}</span>
                    <span className={`fn-status-badge ${inv.badgeClass}`}>{inv.badge}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom right: Feature list */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', padding: '28px' }}>
              <div className="fn-badge" style={{ marginBottom: '12px' }}>🚀 Financial Overview</div>
              <h3 style={{ fontSize: 'clamp(20px,2vw,32px)', fontWeight: 700, lineHeight: 1.2, marginBottom: '8px' }}>
                Built for Individuals<br />
                <span style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic' }}>and Businesses</span>
              </h3>
              <div className="fn-underline-accent" />

              <ul className="fn-feature-list">
                {[
                  { icon: '🏢', title: 'Built for Individuals and Businesses', desc: 'Whether you are managing personal budgets or handling business accounts, our tools adapt to your goals.' },
                  { icon: '📈', title: 'Real Time Financial Insights', desc: '' },
                  { icon: '🛡', title: 'Secure and Reliable Infrastructure', desc: '' },
                ].map(f => (
                  <li key={f.title} className="fn-feature-list-item">
                    <div className="fn-feature-list-icon">{f.icon}</div>
                    <div>
                      <p className="fn-feature-list-title">{f.title}</p>
                      {f.desc && <p className="fn-feature-list-desc">{f.desc}</p>}
                    </div>
                  </li>
                ))}
              </ul>

              <button className="fn-btn fn-btn-outline-solid" style={{ marginTop: '20px' }} onClick={() => onNavigate('Features')}>
                Explore More ↗
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════ PRICING ═══════════════════════ */}
      <section id="pricing" className="fn-section-dark">
        <div className="fn-container">
          <div className="fn-section-header">
            <div className="fn-badge" style={{ justifyContent: 'center' }}>🚀 Pricing Plan</div>
            <h2 className="fn-heading-section">
              Select the Plan That <span className="serif-part">Fits Your Needs</span>
            </h2>
            <p>An all-in-one platform to track, analyze, and optimize your financial performance in real time.</p>
          </div>

          <div className="fn-pricing-grid">
            {pricingPlans.map(plan => (
              <div key={plan.id} className={`fn-pricing-card ${plan.id === 'pro' ? 'pro' : ''}`}>
                <div className="fn-pricing-header">
                  <span className="fn-pricing-name">{plan.name}</span>
                  {plan.badge && <span className="fn-pricing-best">{plan.badge}</span>}
                </div>
                <p className="fn-pricing-desc">{plan.desc}</p>

                <div className="fn-pricing-price">
                  {plan.priceOld && <div className="fn-price-old">{plan.priceOld}</div>}
                  <div>
                    <span className="fn-price-current">{plan.price}</span>
                    <span className="fn-price-period">{plan.period}</span>
                  </div>
                  {plan.note && <div className="fn-price-note">{plan.note}</div>}
                </div>

                <button className={`fn-btn ${plan.ctaClass}`} style={{ marginBottom: '24px' }}>
                  {plan.ctaText}
                </button>

                <p className="fn-pricing-label">What's included:</p>
                <ul className="fn-pricing-features">
                  {plan.features.map(f => (
                    <li key={f} className="fn-pricing-feature">
                      <span className="fn-pricing-check">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════ TESTIMONIALS ═══════════════════════ */}
      <section className="fn-section">
        <div className="fn-container">
          <div className="fn-section-header">
            <div className="fn-badge" style={{ justifyContent: 'center' }}>🚀 Testimonials</div>
            <h2 className="fn-heading-section">
              Take Control of Your <span className="serif-part">Financial Future</span>
            </h2>
            <p>An all-in-one platform to track, analyze, and optimize your financial performance in real time.</p>
          </div>

          <div className="fn-testimonial-card fn-animate-fadein">
            <img
              src={testimonial.photo}
              alt="Testimonial"
              className="fn-testimonial-photo"
              onError={e => {
                (e.target as HTMLImageElement).style.background = '#2a2a2a'
                ;(e.target as HTMLImageElement).src = ''
              }}
            />
            <div className="fn-testimonial-content">
              <div className="fn-testimonial-quote-icon">❝❝</div>
              <div className="fn-testimonial-quote">
                {testimonial.quote.map((part, i) =>
                  testimonial.serifs[i]
                    ? <span key={i} className="serif-part">{part}</span>
                    : <span key={i}>{part}</span>
                )}
              </div>
              <p className="fn-testimonial-attr">{testimonial.attr}</p>

              <div className="fn-testimonial-nav">
                {testimonials.map((_, idx) => (
                  <button key={idx} className={`fn-dot ${idx === testimonialIdx ? 'active' : ''}`} onClick={() => setTestimonialIdx(idx)} aria-label={`Slide ${idx + 1}`} style={{ border: 'none', cursor: 'pointer' }} />
                ))}
                <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    Next → {testimonials[(testimonialIdx + 1) % testimonials.length].attr.replace('— ', '')}
                  </span>
                  <button className="fn-nav-arrow" onClick={() => setTestimonialIdx(i => (i - 1 + testimonials.length) % testimonials.length)}>←</button>
                  <button className="fn-nav-arrow" onClick={() => setTestimonialIdx(i => (i + 1) % testimonials.length)}>→</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════ FAQ ═══════════════════════ */}
      <section className="fn-section-dark">
        <div className="fn-container">
          <div className="fn-badge">🚀 FAQ</div>
          <h2 className="fn-heading-section" style={{ marginBottom: '32px' }}>
            Frequently Asked <span className="serif-part">Questions</span>
          </h2>

          <div className="fn-faq-tabs">
            {faqTabs.map(tab => (
              <button
                key={tab}
                className={`fn-faq-tab ${activeFaqTab === tab ? 'active' : ''}`}
                onClick={() => setActiveFaqTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>

          <div>
            {faqItems.map((item, idx) => (
              <div
                key={item.num}
                className={`fn-faq-item ${openFaqIdx === idx ? 'open' : ''}`}
                onClick={() => setOpenFaqIdx(openFaqIdx === idx ? null : idx)}
              >
                <div className="fn-faq-header">
                  <span className="fn-faq-num">{item.num}</span>
                  <span className="fn-faq-question">{item.q}</span>
                  <div className="fn-faq-icon">{openFaqIdx === idx ? '−' : '+'}</div>
                </div>
                <div className="fn-faq-answer">
                  <div className="fn-faq-answer-inner">
                    {item.a}
                    {item.tags && (
                      <div className="fn-faq-tags">
                        {item.tags.map(tag => <span key={tag} className="fn-tag">{tag}</span>)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════ CTA ═══════════════════════ */}
      <section className="fn-cta">
        <img src="/hero-bg.png" alt="Background" className="fn-cta-bg-img" />
        <div className="fn-cta-bg" />
        <div className="fn-cta-content fn-container">
          <div className="fn-badge" style={{ justifyContent: 'center', display: 'inline-flex' }}>🚀 Grow Faster</div>
          <h2 className="fn-heading-section" style={{ fontSize: 'clamp(28px, 4vw, 48px)', marginBottom: '16px' }}>
            Own Your Financial Future<br />
            <span className="serif-part">with Confidence</span>
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '16px', maxWidth: '480px', margin: '0 auto 36px', lineHeight: 1.6 }}>
            Monitor your finances in real time, plan ahead with confidence, and build lasting wealth step by step.
          </p>
          <button className="fn-btn fn-btn-primary" style={{ padding: '14px 32px', fontSize: '15px' }} onClick={() => onNavigate('Signup')}>
            Get Started Free ↗
          </button>
        </div>
      </section>
    </div>
  )
}
