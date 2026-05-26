import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shield, Eye, EyeOff, Lock } from 'lucide-react'

type Role = 'Admin' | 'Investigator' | 'Analyst'

const roles: Role[] = ['Admin', 'Investigator', 'Analyst']

export function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<Role>('Admin')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!email.trim()) {
      setError('Please enter your email address.')
      return
    }
    if (!password.trim()) {
      setError('Please enter your password.')
      return
    }

    setLoading(true)
    // Simulate auth delay
    setTimeout(() => {
      setLoading(false)
      navigate('/dashboard')
    }, 900)
  }

  return (
    <div className="relative min-h-screen bg-[#0A0A0A] flex items-center justify-center overflow-hidden">
      {/* Animated ambient glows */}
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
      >
        {/* Amber glow - top left */}
        <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-[#F5A623] opacity-[0.06] blur-[120px] animate-pulse" />
        {/* Blue glow - bottom right */}
        <div className="absolute -bottom-32 -right-32 w-[500px] h-[500px] rounded-full bg-blue-600 opacity-[0.05] blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
        {/* Subtle center amber */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full bg-[#F5A623] opacity-[0.025] blur-[100px]" />
      </div>

      {/* Grid overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
        aria-hidden="true"
      />

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-10 shadow-[0_24px_80px_rgba(0,0,0,0.6)]">

          {/* Logo + Heading */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 bg-[#F5A623] rounded-2xl flex items-center justify-center mb-5 shadow-[0_0_32px_rgba(245,166,35,0.3)]">
              <Shield size={28} className="text-black" />
            </div>
            <h1 className="text-white text-2xl font-bold tracking-tight">IntelliTrace</h1>
            <p className="text-[#555] text-sm mt-1">Financial Intelligence Platform</p>
          </div>

          {/* Role Selector */}
          <div className="mb-6">
            <label className="block text-[#666] text-xs font-semibold uppercase tracking-widest mb-2">
              Sign in as
            </label>
            <div className="flex gap-2">
              {roles.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={[
                    'flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-150',
                    role === r
                      ? 'bg-[#F5A623] text-black shadow-[0_0_16px_rgba(245,166,35,0.2)]'
                      : 'bg-[#222] text-[#999] hover:text-white hover:bg-[#2A2A2A]',
                  ].join(' ')}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate>
            {/* Email */}
            <div className="mb-4">
              <label htmlFor="email" className="block text-[#666] text-xs font-semibold uppercase tracking-widest mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="investigator@intellitrace.io"
                className="w-full bg-[#222] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white placeholder-[#444] text-sm focus:border-[#F5A623] focus:ring-2 focus:ring-[#F5A623]/20 outline-none transition"
              />
            </div>

            {/* Password */}
            <div className="mb-5">
              <label htmlFor="password" className="block text-[#666] text-xs font-semibold uppercase tracking-widest mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-[#222] border border-[#2A2A2A] rounded-lg px-4 py-3 pr-11 text-white placeholder-[#444] text-sm focus:border-[#F5A623] focus:ring-2 focus:ring-[#F5A623]/20 outline-none transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#555] hover:text-[#999] transition"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Remember me + Forgot password */}
            <div className="flex items-center justify-between mb-6">
              <label className="flex items-center gap-2 cursor-pointer group">
                <div
                  className={[
                    'w-4 h-4 rounded border flex items-center justify-center transition',
                    rememberMe ? 'bg-[#F5A623] border-[#F5A623]' : 'border-[#3A3A3A] bg-[#222] group-hover:border-[#555]',
                  ].join(' ')}
                  onClick={() => setRememberMe((v) => !v)}
                  role="checkbox"
                  aria-checked={rememberMe}
                  tabIndex={0}
                  onKeyDown={(e) => e.key === ' ' && setRememberMe((v) => !v)}
                >
                  {rememberMe && (
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path d="M1 4L3.5 6.5L9 1" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <span className="text-[#666] text-xs select-none">Remember me</span>
              </label>
              <button
                type="button"
                className="text-[#F5A623] text-xs hover:text-[#D4891A] transition"
              >
                Forgot password?
              </button>
            </div>

            {/* Error message */}
            {error && (
              <p className="text-red-400 text-xs mb-4 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#F5A623] hover:bg-[#D4891A] disabled:opacity-60 disabled:cursor-not-allowed text-black font-bold rounded-lg py-3 text-sm transition-all duration-200 shadow-[0_4px_24px_rgba(245,166,35,0.2)] hover:shadow-[0_4px_32px_rgba(245,166,35,0.3)]"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-black" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Authenticating...
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Security Footer */}
          <div className="flex items-center justify-center gap-1.5 mt-7">
            <Lock size={11} className="text-[#3A3A3A]" />
            <span className="text-[#3A3A3A] text-[11px]">Secured with AES-256 encryption</span>
          </div>
        </div>

        {/* Version tag */}
        <p className="text-center text-[#333] text-[11px] mt-5">
          IntelliTrace v2.4.1 &mdash; Internal Use Only
        </p>
      </div>
    </div>
  )
}
