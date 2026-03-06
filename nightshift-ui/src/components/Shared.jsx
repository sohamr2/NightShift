/* ── Icons ───────────────────────────────────────────────── */
export const ArrowRight = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M12 5l7 7-7 7"/>
  </svg>
)

export const SendIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"/>
    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>
)

export const SpinnerIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="animate-spin"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <circle cx="12" cy="12" r="10" strokeOpacity="0.2"/>
    <path d="M12 2a10 10 0 0 1 10 10"/>
  </svg>
)

export const UserIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
  </svg>
)

export const CheckIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

/* ── Wordmark ────────────────────────────────────────────── */
export const Wordmark = ({ size = 'md' }) => {
  const base = size === 'sm'
    ? 'text-sm tracking-tight'
    : 'text-base tracking-tight'
  return (
    <div className={`flex items-center gap-2 font-sans font-semibold ${base}`}>
      <span className="text-accent text-lg leading-none select-none">●</span>
      <span className="text-bright">MindMetrics</span>
    </div>
  )
}

/* ── Step counter ────────────────────────────────────────── */
export const StepCounter = ({ current, total, label }) => (
  <div className="flex items-center gap-3">
    <div className="flex gap-1">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-[3px] rounded-full transition-all duration-500 ${
            i < current ? 'w-4 bg-accent' :
            i === current ? 'w-4 bg-accent' :
            'w-2 bg-dim'
          }`}
        />
      ))}
    </div>
    {label && <span className="text-[11px] font-mono text-muted">{label}</span>}
  </div>
)

/* ── Luna avatar ─────────────────────────────────────────── */
export const LunaAvatar = () => (
  <div className="w-8 h-8 rounded-full bg-accent/15 ring-1 ring-accent/30
                  flex items-center justify-center text-sm shrink-0 select-none">
    🌙
  </div>
)

export const UserAvatar = () => (
  <div className="w-8 h-8 rounded-full bg-raised ring-1 ring-border
                  flex items-center justify-center shrink-0 text-muted">
    <UserIcon size={13} />
  </div>
)

/* ── Typing indicator ────────────────────────────────────── */
export const TypingDots = () => (
  <div className="flex gap-1 px-4 py-3 bg-raised ring-1 ring-border rounded-2xl rounded-tl-sm w-fit">
    {[0, 0.2, 0.4].map((d, i) => (
      <span
        key={i}
        className="w-1.5 h-1.5 rounded-full bg-muted inline-block"
        style={{ animation: `fadeInOut 1.2s ${d}s ease-in-out infinite` }}
      />
    ))}
    <style>{`
      @keyframes fadeInOut {
        0%, 60%, 100% { opacity: 0.2; transform: scale(0.8); }
        30% { opacity: 1; transform: scale(1); }
      }
    `}</style>
  </div>
)
