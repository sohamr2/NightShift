import { Wordmark, SpinnerIcon } from './Shared'
import { getGoogleLoginUrl } from '../api'

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 48 48">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
  </svg>
)

export default function AuthScreen({ onAuth, loading: externalLoading }) {
  const isLoading = externalLoading || false

  const handleGoogleLogin = () => {
    window.location.href = getGoogleLoginUrl()
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
          <h1 style={{ fontFamily: '"Instrument Serif", Georgia, serif', fontStyle: 'italic', fontSize: 'clamp(2.4rem, 8vw, 3rem)', lineHeight: '1.08', color: '#111122', marginBottom: '0.75rem' }}>
            Know your{'\n'}digital self.
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#6E6E80' }}>
            Sign in to get your personalized screen-health assessment.
          </p>
        </div>

        {/* Divider */}
        <div className="divider enter mb-8" style={{ animationDelay: '80ms' }} />

        {/* Google Sign-In Button */}
        <div className="enter" style={{ animationDelay: '110ms' }}>
          {isLoading ? (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem',
              width: '100%', padding: '0.875rem 1.5rem', borderRadius: '0.75rem',
              backgroundColor: '#F0F0F4', border: '1px solid #E0E0E6',
              color: '#6E6E80', fontSize: '0.875rem', fontFamily: '"Figtree", system-ui, sans-serif',
            }}>
              <SpinnerIcon /> Signing you in…
            </div>
          ) : (
            <button
              id="auth-google"
              onClick={handleGoogleLogin}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem',
                width: '100%', padding: '0.875rem 1.5rem', borderRadius: '0.75rem',
                backgroundColor: '#2563EB', border: 'none', cursor: 'pointer',
                color: '#FFFFFF', fontSize: '0.875rem', fontWeight: 600,
                fontFamily: '"Figtree", system-ui, sans-serif',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = '#1D4ED8'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = '#2563EB'}
            >
              <GoogleIcon />
              Continue with Google
            </button>
          )}
        </div>

        {/* Trust note */}
        <p className="enter" style={{ animationDelay: '160ms', marginTop: '1.5rem', fontSize: '0.75rem', color: '#6E6E80', textAlign: 'center' }}>
          We only access your name, email, and profile photo.
        </p>

        {/* Fine print */}
        <p className="enter" style={{ animationDelay: '200ms', marginTop: '3rem', fontSize: '0.7rem', color: 'rgba(110,110,128,0.5)', textAlign: 'center' }}>
          Your data stays private. No tracking.
        </p>
      </div>
    </div>
  )
}
