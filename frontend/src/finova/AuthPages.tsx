import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export function LoginPage({ onNavigate }: { onNavigate: (p: string) => void }) {
  const [form, setForm] = useState({ email: '', password: '' })
  const navigate = useNavigate()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    navigate('/dashboard')
  }

  return (
    <div className="fn-auth-page">
      <div className="fn-auth-card">
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '32px' }}>
          <div className="fn-nav-logo-icon">⚡</div>
          <span className="fn-nav-logo-text">IntelliTrace</span>
        </div>

        <h1 className="fn-auth-title">Welcome back</h1>
        <p className="fn-auth-subtitle">Sign in to your IntelliTrace account</p>

        <form onSubmit={handleSubmit}>
          <div className="fn-input-group">
            <label className="fn-label" htmlFor="login-email">Email address</label>
            <input
              id="login-email"
              type="email"
              className="fn-input"
              placeholder="you@example.com"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              required
            />
          </div>
          <div className="fn-input-group">
            <label className="fn-label" htmlFor="login-password">
              Password
              <button type="button" style={{ float: 'right', background: 'none', border: 'none', color: 'var(--primary)', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit' }}>
                Forgot password?
              </button>
            </label>
            <input
              id="login-password"
              type="password"
              className="fn-input"
              placeholder="••••••••"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              required
            />
          </div>

          <button type="submit" className="fn-btn fn-btn-primary" style={{ width: '100%', marginTop: '8px' }}>
            Sign In ↗
          </button>
        </form>

        <div className="fn-auth-divider">or continue with</div>

        <div style={{ display: 'flex', gap: '12px' }}>
          {['Google', 'Apple'].map(p => (
            <button key={p} style={{
              flex: 1, padding: '10px', background: 'var(--bg-elevated)', border: '1px solid var(--border)',
              borderRadius: '8px', color: 'var(--text-primary)', fontSize: '13px', fontWeight: 500,
              cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s ease',
            }}>
              {p === 'Google' ? '🌐' : '🍎'} {p}
            </button>
          ))}
        </div>

        <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '13px', color: 'var(--text-muted)' }}>
          Don't have an account?{' '}
          <button onClick={() => onNavigate('Signup')} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontFamily: 'inherit', fontSize: '13px', fontWeight: 500 }}>
            Sign up free
          </button>
        </p>
      </div>
    </div>
  )
}

export function SignupPage({ onNavigate }: { onNavigate: (p: string) => void }) {
  const [form, setForm] = useState({ name: '', email: '', password: '', plan: 'starter' })
  const [step, setStep] = useState(1)
  const navigate = useNavigate()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (step === 1) setStep(2)
    else navigate('/dashboard')
  }

  return (
    <div className="fn-auth-page">
      <div className="fn-auth-card" style={{ maxWidth: '460px' }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
          <div className="fn-nav-logo-icon">⚡</div>
          <span className="fn-nav-logo-text">IntelliTrace</span>
        </div>

        {/* Progress */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '28px' }}>
          {[1, 2].map(s => (
            <div key={s} style={{
              flex: 1, height: '3px', borderRadius: '2px',
              background: step >= s ? 'var(--primary)' : 'var(--border)',
              transition: 'background 0.3s ease',
            }} />
          ))}
        </div>

        <h1 className="fn-auth-title">{step === 1 ? 'Create your account' : 'Choose your plan'}</h1>
        <p className="fn-auth-subtitle">{step === 1 ? '14-day free trial. No credit card required.' : 'You can upgrade or change at any time.'}</p>

        <form onSubmit={handleSubmit}>
          {step === 1 ? (
            <>
              <div className="fn-input-group">
                <label className="fn-label" htmlFor="signup-name">Full name</label>
                <input id="signup-name" type="text" className="fn-input" placeholder="John Carter" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
              </div>
              <div className="fn-input-group">
                <label className="fn-label" htmlFor="signup-email">Email address</label>
                <input id="signup-email" type="email" className="fn-input" placeholder="you@example.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
              </div>
              <div className="fn-input-group">
                <label className="fn-label" htmlFor="signup-password">Password</label>
                <input id="signup-password" type="password" className="fn-input" placeholder="Min. 8 characters" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />
              </div>
            </>
          ) : (
            <>
              {[
                { id: 'starter', name: 'Starter', price: '$19/mo', desc: 'For individuals' },
                { id: 'pro', name: 'Pro', price: '$399/mo', desc: 'Best value — most popular' },
                { id: 'enterprise', name: 'Enterprise', price: 'Custom', desc: 'For large teams' },
              ].map(p => (
                <div
                  key={p.id}
                  onClick={() => setForm(f => ({ ...f, plan: p.id }))}
                  style={{
                    padding: '16px', border: `1px solid ${form.plan === p.id ? 'var(--primary)' : 'var(--border)'}`,
                    borderRadius: '10px', marginBottom: '12px', cursor: 'pointer',
                    background: form.plan === p.id ? 'rgba(245,166,35,0.05)' : 'transparent',
                    transition: 'all 0.2s ease', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '2px' }}>{p.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{p.desc}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: form.plan === p.id ? 'var(--primary)' : 'var(--text-primary)' }}>{p.price}</div>
                  </div>
                </div>
              ))}
            </>
          )}

          <button type="submit" className="fn-btn fn-btn-primary" style={{ width: '100%', marginTop: '8px' }}>
            {step === 1 ? 'Continue →' : 'Start Free Trial ↗'}
          </button>
        </form>

        {step === 1 && (
          <>
            <div className="fn-auth-divider">or sign up with</div>
            <div style={{ display: 'flex', gap: '12px' }}>
              {['Google', 'Apple'].map(p => (
                <button key={p} style={{
                  flex: 1, padding: '10px', background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                  borderRadius: '8px', color: 'var(--text-primary)', fontSize: '13px', fontWeight: 500,
                  cursor: 'pointer', fontFamily: 'inherit',
                }}>
                  {p === 'Google' ? '🌐' : '🍎'} {p}
                </button>
              ))}
            </div>
          </>
        )}

        <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '13px', color: 'var(--text-muted)' }}>
          Already have an account?{' '}
          <button onClick={() => onNavigate('Login')} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontFamily: 'inherit', fontSize: '13px', fontWeight: 500 }}>
            Sign in
          </button>
        </p>
      </div>
    </div>
  )
}
