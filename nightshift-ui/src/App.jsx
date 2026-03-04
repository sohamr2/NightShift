import { useState, useEffect } from 'react'
import AuthScreen    from './components/AuthScreen'
import LandingScreen from './components/LandingScreen'
import QuizScreen    from './components/QuizScreen'
import ResultsScreen from './components/ResultsScreen'
import ChatScreen    from './components/ChatScreen'

/*
  Step map:
    0 → AuthScreen     (login / sign-up)
    1 → LandingScreen  (hero + CTA)
    2 → QuizScreen     (data collection + API call)
    3 → ResultsScreen  (archetype + risk dashboard)
    4 → ChatScreen     (Luna chat)
*/

export default function App() {
  const [step, setStep]     = useState(0)
  const [user, setUser]     = useState(null)    // { email }
  const [result, setResult] = useState(null)    // { archetype, risk_status }

  // Fade-transition key so the screen-enter animation re-fires on step change
  const [key, setKey] = useState(0)

  const goTo = (n) => {
    setKey(k => k + 1)
    setStep(n)
  }

  // Prevent accidental back-navigation from resetting the quiz
  useEffect(() => {
    const prevented = (e) => e.preventDefault()
    window.addEventListener('beforeunload', prevented)
    return () => window.removeEventListener('beforeunload', prevented)
  }, [])

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
        />
      )}

      {step === 2 && (
        <QuizScreen
          onResult={(r) => { setResult(r); goTo(3) }}
        />
      )}

      {step === 3 && result && (
        <ResultsScreen
          result={result}
          onActionPlan={() => goTo(4)}
        />
      )}

      {step === 4 && result && (
        <ChatScreen
          result={result}
          user={user}
        />
      )}
    </div>
  )
}
