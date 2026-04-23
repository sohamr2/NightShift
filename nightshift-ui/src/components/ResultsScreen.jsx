import { Wordmark, StepCounter, ArrowRight, CheckIcon } from './Shared'

export const getDepressionSeverity = (score) => {
  if (score <= 9) return { level: 'Mild', color: 'text-success', bg: 'bg-success/10', border: 'border-success/20', dot: 'bg-success' }
  if (score <= 18) return { level: 'Moderate', color: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/20', dot: 'bg-warning' }
  return { level: 'Severe', color: 'text-danger', bg: 'bg-danger/10', border: 'border-danger/20', dot: 'bg-danger' }
}

export const getAnxietySeverity = (score) => {
  if (score <= 7) return { level: 'Mild', color: 'text-success', bg: 'bg-success/10', border: 'border-success/20', dot: 'bg-success' }
  if (score <= 15) return { level: 'Moderate', color: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/20', dot: 'bg-warning' }
  return { level: 'Severe', color: 'text-danger', bg: 'bg-danger/10', border: 'border-danger/20', dot: 'bg-danger' }
}

export default function ResultsScreen({ result, onActionPlan }) {
  const { phq9_score, gad7_score } = result

  const depression = getDepressionSeverity(phq9_score)
  const anxiety = getAnxietySeverity(gad7_score)

  return (
    <div className="min-h-dvh flex flex-col px-6 py-8 max-w-xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-16 enter" style={{ animationDelay: '0ms' }}>
        <Wordmark size="sm" />
        <StepCounter current={2} total={4} label="Step 3 of 4" />
      </div>

      {/* Label */}
      <p className="label mb-4 enter" style={{ animationDelay: '60ms' }}>
        Assessment Complete
      </p>

      {/* Hero Title */}
      <h1
        className={`font-serif italic text-[clamp(2.5rem,8vw,5rem)] leading-[1.05]
                    text-bright mb-6 enter text-balance`}
        style={{ animationDelay: '90ms' }}
      >
        Your clinical baseline.
      </h1>

      <p className="text-muted text-base mb-10 enter" style={{ animationDelay: '120ms' }}>
        Based on your inputs, we've carefully evaluated your clinical baseline for depression and anxiety markers related to screen usage.
      </p>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10 enter" style={{ animationDelay: '140ms' }}>
        
        {/* Depression Card */}
        <div className={`flex flex-col p-5 rounded-2xl border ${depression.bg} ${depression.border}`}>
          <div className="flex items-center justify-between mb-8">
            <span className="text-sm font-medium text-text">Depression (PHQ-9)</span>
            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-semibold uppercase tracking-wider bg-black/5 ${depression.color}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${depression.dot}`} />
              {depression.level}
            </span>
          </div>
          <div>
            <span className="text-4xl font-serif text-bright">{phq9_score.toFixed(1)}</span>
            <span className="text-sm text-muted font-mono ml-2">/ 27</span>
          </div>
        </div>

        {/* Anxiety Card */}
        <div className={`flex flex-col p-5 rounded-2xl border ${anxiety.bg} ${anxiety.border}`}>
          <div className="flex items-center justify-between mb-8">
            <span className="text-sm font-medium text-text">Anxiety (GAD-7)</span>
            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-semibold uppercase tracking-wider bg-black/5 ${anxiety.color}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${anxiety.dot}`} />
              {anxiety.level}
            </span>
          </div>
          <div>
            <span className="text-4xl font-serif text-bright">{gad7_score.toFixed(1)}</span>
            <span className="text-sm text-muted font-mono ml-2">/ 21</span>
          </div>
        </div>

      </div>

      {/* Divider */}
      <div className="divider mb-8 enter" style={{ animationDelay: '160ms' }} />

      {/* What this means */}
      <div className="mb-10 enter" style={{ animationDelay: '180ms' }}>
        <p className="label mb-4">What this means</p>
        <ul className="flex flex-col gap-3">
          <li className="flex items-start gap-3 text-sm text-text">
            <span className="mt-0.5 shrink-0 text-accent"><CheckIcon /></span>
            Your scores provide a snapshot of your current mental wellbeing.
          </li>
          <li className="flex items-start gap-3 text-sm text-text">
            <span className="mt-0.5 shrink-0 text-accent"><CheckIcon /></span>
            These metrics are often elevated by late-night scrolling and social comparison.
          </li>
          <li className="flex items-start gap-3 text-sm text-text">
            <span className="mt-0.5 shrink-0 text-accent"><CheckIcon /></span>
            Luna has a personalized recovery plan ready for you to address this.
          </li>
        </ul>
      </div>

      {/* CTA */}
      <div className="enter" style={{ animationDelay: '220ms' }}>
        <button
          id="results-action-plan"
          onClick={onActionPlan}
          className="btn w-full py-3.5 text-base"
        >
          Get My Action Plan <ArrowRight />
        </button>
        <p className="text-center text-xs text-muted mt-4 font-mono">
          Powered by MindMetrics ML Engine
        </p>
      </div>
    </div>
  )
}
