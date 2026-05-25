/* Pricing Page — standalone detailed pricing */
const plans = [
  {
    id: 'starter',
    name: 'Starter Plan',
    desc: 'Perfect for individuals managing personal finances.',
    price: '$19',
    period: '/month',
    features: [
      'Track income and expenses',
      'Smart budget planning tools',
      'Basic financial reports',
      'Secure cloud data storage',
      'Email support',
      'Up to 3 bank accounts',
      'Mobile app access',
    ],
    ctaText: 'Get Started ↗',
    ctaStyle: 'dark' as const,
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
    features: [
      'Everything in Starter',
      'Advanced financial analytics',
      'Automated expense categorization',
      'Multi-account management',
      'Export reports (PDF, CSV)',
      'Priority customer support',
      'API access',
      'Team collaboration (5 users)',
    ],
    ctaText: 'Unlock Pro Features ↗',
    ctaStyle: 'white' as const,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    desc: 'Fully custom solution for large organizations and financial institutions.',
    price: 'Custom',
    period: '',
    features: [
      'Everything in Pro',
      'Unlimited team members',
      'Custom integrations & API',
      'Dedicated account manager',
      'SLA: 99.9% uptime',
      'Audit logs & compliance',
      'White-label options',
      'Advanced security suite',
    ],
    ctaText: 'Contact Sales ↗',
    ctaStyle: 'gold' as const,
  },
]

const faqs = [
  { q: 'Can I change my plan at any time?', a: 'Yes. You can upgrade, downgrade, or cancel your plan at any time. Changes take effect at the start of your next billing cycle.' },
  { q: 'Is there a free trial?', a: 'Yes! All plans come with a 14-day free trial. No credit card required to start.' },
  { q: 'What payment methods do you accept?', a: 'We accept all major credit cards (Visa, Mastercard, Amex), PayPal, and bank transfers for Enterprise plans.' },
  { q: 'What happens to my data if I cancel?', a: 'Your data is retained for 30 days after cancellation. You can export everything before your account closes.' },
]

export function PricingPage({ onNavigate }: { onNavigate: (p: string) => void }) {
  return (
    <div>
      {/* Hero */}
      <section className="fn-page-hero">
        <div className="fn-container">
          <div className="fn-badge" style={{ display: 'inline-flex', marginBottom: '16px' }}>🚀 Pricing</div>
          <h1 className="fn-heading-hero" style={{ marginBottom: '16px' }}>
            Simple, Transparent<br />
            <span style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic' }}>Pricing</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '16px', maxWidth: '480px', margin: '0 auto' }}>
            No hidden fees. No surprises. Pick a plan and start growing your financial confidence today.
          </p>
        </div>
      </section>

      {/* Pricing cards */}
      <section className="fn-section">
        <div className="fn-container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', maxWidth: '960px', margin: '0 auto' }}>
            {plans.map(plan => (
              <div
                key={plan.id}
                className={`fn-pricing-card ${plan.id === 'pro' ? 'pro' : ''}`}
                style={plan.id === 'enterprise' ? { borderColor: '#4CAF50', boxShadow: '0 0 0 1px rgba(76,175,80,0.15)' } : {}}
              >
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

                <button
                  className={`fn-btn ${plan.ctaStyle === 'white' ? 'fn-btn-white-fill' : plan.ctaStyle === 'gold' ? 'fn-btn-gold' : 'fn-btn-dark'}`}
                  style={{ marginBottom: '24px' }}
                  onClick={() => onNavigate(plan.id === 'enterprise' ? 'Signup' : 'Signup')}
                >
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

          {/* Guarantee */}
          <div style={{ textAlign: 'center', marginTop: '48px', padding: '32px', background: 'var(--bg-dark)', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', maxWidth: '600px', margin: '48px auto 0' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>🛡</div>
            <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>30-Day Money-Back Guarantee</h3>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Not satisfied? We'll refund your payment within 30 days, no questions asked.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="fn-section-dark">
        <div className="fn-container" style={{ maxWidth: '700px', margin: '0 auto', padding: '0 24px' }}>
          <div className="fn-section-header">
            <h2 className="fn-heading-section">Pricing <span className="serif-part">Questions</span></h2>
          </div>
          {faqs.map(f => (
            <div key={f.q} style={{ padding: '20px 0', borderBottom: '1px solid var(--border-subtle)' }}>
              <p style={{ fontSize: '15px', fontWeight: 600, marginBottom: '10px', color: 'var(--text-primary)' }}>{f.q}</p>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.7 }}>{f.a}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
