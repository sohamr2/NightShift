import { Wordmark, ArrowRight } from './Shared'

const stats = [
  { value: '4.2h', label: 'daily screen time avg.' },
  { value: '68%',  label: 'of users classified at-risk' },
  { value: '8min', label: 'to your personalized plan' },
]

export default function LandingScreen({ user, onStart }) {
  return (
    <div className="min-h-dvh flex flex-col px-6 py-8 max-w-3xl mx-auto">

      {/* Top nav */}
      <nav className="flex items-center justify-between mb-20 enter"
        style={{ animationDelay: '0ms' }}>
        <Wordmark size="sm" />
        <span className="text-xs font-mono text-muted">
          {user?.name || user?.email?.split('@')[0] || ''}
        </span>
      </nav>

      {/* Hero */}
      <div className="flex-1 flex flex-col justify-center">

        {/* Tag */}
        <div className="mb-6 enter" style={{ animationDelay: '60ms' }}>
          <span className="tag bg-accent-dim text-accent ring-1 ring-accent/20 font-mono">
            AI Screen Health Analysis
          </span>
        </div>

        {/* Headline — the signature element */}
        <h1 className="font-serif italic text-[clamp(3rem,8vw,5.5rem)] leading-[1.05]
                       text-bright mb-6 enter text-balance"
          style={{ animationDelay: '90ms' }}>
          Know your<br />
          <span className="text-muted">digital self.</span>
        </h1>

        <p className="text-lg text-muted max-w-md leading-relaxed mb-10 enter"
          style={{ animationDelay: '130ms' }}>
          One AI analyst. A recovery plan built
          around your exact archetype.
        </p>

        <div className="enter" style={{ animationDelay: '170ms' }}>
          <button
            id="landing-start"
            onClick={onStart}
            className="btn text-base px-8 py-4"
          >
            Start Assessment <ArrowRight size={18} />
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="mt-20 enter" style={{ animationDelay: '220ms' }}>
        <div className="divider mb-8" />
        <div className="grid grid-cols-3 gap-6">
          {stats.map((s, i) => (
            <div key={i}>
              <p className="text-2xl font-serif text-bright mb-1">{s.value}</p>
              <p className="text-xs text-muted leading-snug">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
