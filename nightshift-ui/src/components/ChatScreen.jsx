import { useState, useRef, useEffect } from 'react'
import { Wordmark, StepCounter, SendIcon, LunaAvatar, UserAvatar, TypingDots } from './Shared'
import { getDepressionSeverity, getAnxietySeverity } from './ResultsScreen'

const getIntro = (depSev, anxSev) => {
  const note = (depSev === 'Severe' || anxSev === 'Severe')
    ? "I've spotted some areas we should address."
    : "I'm here to help you build healthier digital habits."
  
  return [
    `Hey, I'm Luna — your MindMetrics coach. 🌙`,
    `I noticed your baseline shows **${depSev}** indicators for depression and **${anxSev}** for anxiety. ${note}`,
    `Ask me anything: how to improve your sleep hygiene, strategies to reduce screen time, or what to prioritize first.`
  ]
}

const parseText = (text) => {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((p, i) =>
    p.startsWith('**') && p.endsWith('**')
      ? <strong key={i} className="text-bright font-semibold">{p.slice(2, -2)}</strong>
      : p
  )
}

export default function ChatScreen({ result, user }) {
  const { phq9_score, gad7_score } = result
  
  const depSev = getDepressionSeverity(phq9_score).level
  const anxSev = getAnxietySeverity(gad7_score).level

  const introLines = getIntro(depSev, anxSev)

  const [messages, setMessages] = useState([])
  const [input, setInput]       = useState('')
  const [typing, setTyping]     = useState(false)
  const [error, setError]       = useState('')
  const [introIdx, setIntroIdx] = useState(0)
  const bottomRef = useRef(null)
  const inputRef  = useRef(null)

  useEffect(() => {
    if (introIdx >= introLines.length) return
    const t = setTimeout(() => {
      setMessages(m => [...m, { role: 'luna', text: introLines[introIdx] }])
      setIntroIdx(i => i + 1)
    }, introIdx === 0 ? 500 : 1100)
    return () => clearTimeout(t)
  }, [introIdx]) // eslint-disable-line

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typing])

  const sendMessage = async () => {
    const text = input.trim()
    if (!text || typing) return

    const userMsg = { role: 'user', text }
    setInput('')
    setError('')
    setMessages(m => [...m, userMsg])
    setTyping(true)

    const history = [...messages, userMsg]

    try {
      const res = await fetch('https://nightshift-s5rm.onrender.com/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          depression_severity: depSev,
          anxiety_severity: anxSev,
          history: history.map(m => ({ role: m.role, text: m.text })),
          message: text,
        }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setMessages(m => [...m, { role: 'luna', text: data.reply }])
    } catch (e) {
      setError(`Luna couldn't respond: ${e.message}`)
    } finally {
      setTyping(false)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  return (
    <div className="flex flex-col min-h-dvh">

      {/* Fixed top bar */}
      <header className="fixed top-0 left-0 right-0 z-20 bg-bg/90 backdrop-blur-md
                         border-b border-border">
        <div className="max-w-2xl mx-auto px-6 h-14 flex items-center justify-between">
          <Wordmark size="sm" />
          <div className="flex items-center gap-4">
            <StepCounter current={3} total={4} label="Step 4 of 4" />
            <span className="flex items-center gap-1.5 text-xs font-mono text-muted">
              <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
              Luna online
            </span>
          </div>
        </div>
      </header>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto pt-20 pb-32 px-4">
        <div className="max-w-2xl mx-auto flex flex-col gap-4 py-6">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex gap-3 enter ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {msg.role === 'luna' ? <LunaAvatar /> : <UserAvatar />}
              <div className={msg.role === 'luna' ? 'bubble-luna' : 'bubble-user'}>
                {parseText(msg.text)}
              </div>
            </div>
          ))}

          {typing && (
            <div className="flex gap-3 enter">
              <LunaAvatar />
              <TypingDots />
            </div>
          )}

          {error && (
            <p className="text-xs text-danger text-center py-2">
              {error}
            </p>
          )}

          <div ref={bottomRef} />
        </div>
      </main>

      {/* Fixed input bar */}
      <footer className="fixed bottom-0 left-0 right-0 z-20 bg-bg/95 backdrop-blur-md
                         border-t border-border">
        <div className="max-w-2xl mx-auto px-4 py-4 flex gap-3 items-end">
          <textarea
            ref={inputRef}
            id="chat-input"
            rows={1}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Ask Luna anything…"
            className="field resize-none flex-1"
            style={{ minHeight: '44px', maxHeight: '120px' }}
          />
          <button
            id="chat-send"
            onClick={sendMessage}
            disabled={!input.trim() || typing}
            className="btn px-4 py-3 shrink-0 disabled:opacity-30"
            aria-label="Send"
          >
            <SendIcon />
          </button>
        </div>
        <p className="text-center text-[11px] text-muted/40 pb-3 font-mono">
          Luna is an AI coach, not a medical professional.
        </p>
      </footer>
    </div>
  )
}
