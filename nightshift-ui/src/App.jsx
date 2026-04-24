import { useState, useEffect } from 'react'
import AuthScreen      from './components/AuthScreen'
import LandingScreen   from './components/LandingScreen'
import QuizScreen      from './components/QuizScreen'
import ResultsScreen   from './components/ResultsScreen'
import DashboardScreen from './components/DashboardScreen'
import ChatScreen      from './components/ChatScreen'
import { getToken, setToken, clearToken, fetchMe, fetchLatestAssessment } from './api'

/*
  Step map:
    0 → AuthScreen      (Google OAuth)
    1 → LandingScreen   (hero + CTA)
    2 → QuizScreen      (data collection + API call)
    3 → ResultsScreen   (archetype + risk dashboard)
    4 → DashboardScreen (dataset DV dashboard)
    5 → ChatScreen      (Luna chat)
*/

export default function App() {
  const [step, setStep]         = useState(0)
  const [user, setUser]         = useState(null)    // { id, email, name, picture }
  const [result, setResult]     = useState(null)    // { archetype, risk_status }
  const [authLoading, setAuthLoading] = useState(true) // checking token on mount

  // Fade-transition key so the screen-enter animation re-fires on step change
  const [key, setKey] = useState(0)

  const goTo = (n) => {
    setKey(k => k + 1)
    setStep(n)
  }

  // ---------------------------------------------------------------------------
  // On mount: check for OAuth callback token in URL, or restore from storage
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const init = async () => {
      // 1. Check if we just came back from Google OAuth (token in URL)
      const params = new URLSearchParams(window.location.search)
      const urlToken = params.get('token')
      if (urlToken) {
        setToken(urlToken)
        // Clean the URL so the token isn't visible
        window.history.replaceState({}, '', window.location.pathname)
      }

      // 2. If we have a stored token, validate it
      const token = getToken()
      if (token) {
        try {
          const me = await fetchMe()
          setUser(me)
          // Check if user has a previous assessment — skip to dashboard if so
          try {
            const lastResult = await fetchLatestAssessment()
            setResult(lastResult)
            goTo(4) // go straight to dashboard
          } catch {
            goTo(1) // no previous assessment — start from landing
          }
        } catch {
          clearToken() // token expired or invalid
        }
      }

      setAuthLoading(false)
    }
    init()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Prevent accidental back-navigation from resetting the quiz
  useEffect(() => {
    const prevented = (e) => e.preventDefault()
    window.addEventListener('beforeunload', prevented)
    return () => window.removeEventListener('beforeunload', prevented)
  }, [])

  const handleLogout = () => {
    clearToken()
    setUser(null)
    setResult(null)
    goTo(0)
  }

  // Show nothing while checking auth on mount
  if (authLoading) {
    return (
      <div style={{
        minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#6E6E80', fontFamily: '"Figtree", system-ui, sans-serif', fontSize: '0.875rem', backgroundColor: '#FFFFFF',
      }}>
        Loading…
      </div>
    )
  }

  return (
    <div key={key}>
      {step === 0 && (
        <AuthScreen
          onAuth={(u) => { setUser(u); goTo(1) }}
        />
      )}

      {step === 1 && (
        <LandingScreen
          user={user}
          onStart={() => goTo(2)}
          onLogout={handleLogout}
        />
      )}

      {step === 2 && (
        <QuizScreen
          onResult={(r) => { setResult(r); goTo(3) }}
          onLogout={handleLogout}
        />
      )}

      {step === 3 && result && (
        <ResultsScreen
          result={result}
          onActionPlan={() => goTo(4)}
          onLogout={handleLogout}
        />
      )}

      {step === 4 && (
        <DashboardScreen
          userAssessment={result}
          onNext={() => goTo(5)}
          onRetest={() => goTo(2)}
          onLogout={handleLogout}
        />
      )}

      {step === 5 && result && (
        <ChatScreen
          result={result}
          user={user}
          onLogout={handleLogout}
        />
      )}
    </div>
  )
}
