import { useState } from 'react'
import { Wordmark, ArrowRight, SpinnerIcon } from './Shared'

export default function AuthScreen({ onAuth }) {
  const [mode, setMode]         = useState('signin')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const isSignup = mode === 'signup'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!email)              { setError('Email is required.'); return }
    if (!password)           { setError('Password is required.'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return }
    setLoading(true)
    await new Promise(r => setTimeout(r, 1000))
    setLoading(false)
    onAuth({ email })
  }

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
      <div style={{ width: '100%', maxWidth: '360px' }}>

        {/* Logo */}
        <div className="enter mb-10" style={{ animationDelay: '0ms' }}>
          <Wordmark />
        </div>

        {/* Headline */}
        <div className="enter mb-8" style={{ animationDelay: '60ms' }}>
          <h1 style={{ fontFamily: '"Instrument Serif", Georgia, serif', fontStyle: 'italic', fontSize: 'clamp(2.4rem, 8vw, 3rem)', lineHeight: '1.08', color: '#FAFAFF', marginBottom: '0.75rem' }}>
            {isSignup ? 'Create your\naccount.' : 'Welcome\nback.'}
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#6E6E80' }}>
            {isSignup ? 'Start understanding your screen habits.' : 'Sign in to continue your assessment.'}
          </p>
        </div>

        {/* Divider */}
        <div className="divider enter mb-8" style={{ animationDelay: '80ms' }} />

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate className="enter" style={{ animationDelay: '110ms', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label htmlFor="auth-email" className="label">Email</label>
            <input id="auth-email" type="email" autoComplete="email" placeholder="you@example.com"
              value={email} onChange={e => setEmail(e.target.value)} className="field" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label htmlFor="auth-password" className="label">Password</label>
            <input id="auth-password" type="password" autoComplete={isSignup ? 'new-password' : 'current-password'}
              placeholder="Minimum 6 characters" value={password} onChange={e => setPassword(e.target.value)} className="field" />
          </div>

          {error && (
            <p style={{ fontSize: '0.75rem', color: '#F05252', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <span style={{ width: '4px', height: '4px', borderRadius: '99px', backgroundColor: '#F05252', display: 'inline-block', flexShrink: 0 }} />
              {error}
            </p>
          )}

          <button type="submit" id="auth-submit" disabled={loading} className="btn" style={{ width: '100%', marginTop: '0.5rem', paddingTop: '0.875rem', paddingBottom: '0.875rem' }}>
            {loading ? <><SpinnerIcon /> {isSignup ? 'Creating…' : 'Signing in…'}</> : <>{isSignup ? 'Create Account' : 'Sign In'} <ArrowRight /></>}
          </button>
        </form>

        {/* Toggle */}
        <p className="enter" style={{ animationDelay: '160ms', marginTop: '1.5rem', fontSize: '0.875rem', color: '#6E6E80' }}>
          {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button id="auth-mode-toggle"
            onClick={() => { setMode(m => m === 'signin' ? 'signup' : 'signin'); setError('') }}
            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: '#E4E4EF', textDecoration: 'underline', textUnderlineOffset: '2px', fontSize: '0.875rem' }}>
            {isSignup ? 'Sign in' : 'Create one'}
          </button>
        </p>

        <p className="enter" style={{ animationDelay: '200ms', marginTop: '3rem', fontSize: '0.7rem', color: 'rgba(110,110,128,0.5)' }}>
          Your data stays private. No tracking.
        </p>
      </div>
    </div>
  )
}
