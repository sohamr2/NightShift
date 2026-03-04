import { useState } from 'react'
import { Wordmark, StepCounter, SpinnerIcon, ArrowRight } from './Shared'

const PLATFORMS = ['Instagram', 'TikTok', 'YouTube', 'Twitter/X', 'LinkedIn', 'Facebook', 'Snapchat']

const CONTENT_TYPES = [
  'Entertainment/Comedy',
  'Educational/Tech',
  'Lifestyle/Fashion',
  'Gaming',
  'News/Politics',
  'Self-Help/Motivation',
]

const ARCHETYPES = [
  { value: 'Hyper-Connected',   label: 'Hyper-Connected',   desc: 'Always online, high usage across platforms' },
  { value: 'Passive Scroller',  label: 'Passive Scroller',  desc: 'Scrolls without engaging much' },
  { value: 'Average User',      label: 'Average User',      desc: 'Moderate, balanced usage' },
  { value: 'Digital Minimalist',label: 'Digital Minimalist',desc: 'Intentional, low-usage approach' },
]

/* Toggle */
const Toggle = ({ value, onChange }) => (
  <button
    type="button"
    role="switch"
    aria-checked={value}
    onClick={() => onChange(!value)}
    style={{
      position: 'relative',
      display: 'inline-flex',
      alignItems: 'center',
      width: '44px',
      height: '24px',
      borderRadius: '99px',
      border: 'none',
      cursor: 'pointer',
      flexShrink: 0,
      outline: 'none',
      transition: 'background 0.2s',
      background: value ? '#7C6DF0' : '#27272F',
    }}
  >
    <span
      style={{
        position: 'absolute',
        top: '3px',
        left: value ? '23px' : '3px',
        width: '18px',
        height: '18px',
        borderRadius: '50%',
        background: '#ffffff',
        transition: 'left 0.2s cubic-bezier(0.22, 1, 0.36, 1)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
      }}
    />
  </button>
)

/* Chip button row */
const ChipGroup = ({ options, value, onChange }) => (
  <div className="flex flex-wrap gap-2">
    {options.map(opt => {
      const v = typeof opt === 'string' ? opt : opt.value
      const l = typeof opt === 'string' ? opt : opt.label
      return (
        <button
          key={v} type="button"
          onClick={() => onChange(v)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all duration-150
            ${value === v
              ? 'bg-accent-dim border-accent/40 text-accent'
              : 'bg-bg border-border text-muted hover:text-text hover:border-border-strong'}`}
        >
          {l}
        </button>
      )
    })}
  </div>
)

export default function QuizScreen({ onResult }) {
  const [form, setForm] = useState({
    age: '', gender: '', screenTime: '', sleepDuration: '',
    platform: '', activityType: '', contentType: '',
    archetype: '', lateNight: false, socialComparison: false,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const validate = () => {
    if (!form.age || +form.age < 1 || +form.age > 120) return 'Enter a valid age.'
    if (!form.gender)          return 'Select your gender.'
    if (!form.screenTime)      return 'Enter daily screen time in hours.'
    if (!form.sleepDuration)   return 'Enter your sleep duration in hours.'
    if (!form.platform)        return 'Select your primary platform.'
    if (!form.activityType)    return 'Select how you mostly use social media.'
    if (!form.contentType)     return 'Select your dominant content type.'
    if (!form.archetype)       return 'Select your digital archetype.'
    return null
  }

  const handleAnalyze = async () => {
    const err = validate()
    if (err) { setError(err); return }
    setError('')
    setLoading(true)

    const payload = {
      Age:                        parseInt(form.age),
      Gender:                     form.gender,
      Primary_Platform:           form.platform,
      Daily_Screen_Time_Hours:    parseFloat(form.screenTime),
      Sleep_Duration_Hours:       parseFloat(form.sleepDuration),
      Activity_Type:              form.activityType,
      Dominant_Content_Type:      form.contentType,
      User_Archetype:             form.archetype,
      Late_Night_Usage:           form.lateNight ? 1 : 0,
      Social_Comparison_Trigger:  form.socialComparison ? 1 : 0,
    }

    try {
      const res = await fetch('http://127.0.0.1:8000/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error(`Server error ${res.status}`)
      const data = await res.json()
      // Pass archetype + archetype label back so ResultsScreen & ChatScreen can use it
      onResult({ ...data, archetype: form.archetype })
    } catch (e) {
      setError(`API error: ${e.message}. Make sure the backend is running.`)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-dvh flex flex-col px-6 py-8 max-w-2xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-16 enter" style={{ animationDelay: '0ms' }}>
        <Wordmark size="sm" />
        <StepCounter current={1} total={4} label="Step 2 of 5" />
      </div>

      {/* Title */}
      <div className="mb-10 enter" style={{ animationDelay: '60ms' }}>
        <h2 className="font-serif italic text-[2.4rem] leading-[1.1] text-bright mb-2">
          Your habits,<br />in ten questions.
        </h2>
        <p className="text-sm text-muted">Luna uses this to build your profile.</p>
      </div>

      {/* Form */}
      <div className="flex flex-col gap-7 enter" style={{ animationDelay: '100ms' }}>

        {/* Row 1: Age + Gender */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="q-age" className="label">Age</label>
            <input id="q-age" type="text" inputMode="numeric" pattern="[0-9]*" placeholder="e.g. 24"
              value={form.age} onChange={e => set('age', e.target.value)} className="field" />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="q-gender" className="label">Gender</label>
            <select id="q-gender" value={form.gender}
              onChange={e => set('gender', e.target.value)} className="field cursor-pointer">
              <option value="">Select</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>
        </div>

        {/* Row 2: Screen time + Sleep */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="q-screen" className="label">Daily Screen Time (hrs)</label>
            <input id="q-screen" type="text" inputMode="decimal" pattern="[0-9.]*" placeholder="e.g. 6.5"
              value={form.screenTime} onChange={e => set('screenTime', e.target.value)} className="field" />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="q-sleep" className="label">Sleep Duration (hrs)</label>
            <input id="q-sleep" type="text" inputMode="decimal" pattern="[0-9.]*" placeholder="e.g. 7"
              value={form.sleepDuration} onChange={e => set('sleepDuration', e.target.value)} className="field" />
          </div>
        </div>

        {/* Primary Platform */}
        <div className="flex flex-col gap-3">
          <span className="label">Primary Platform</span>
          <ChipGroup options={PLATFORMS} value={form.platform} onChange={v => set('platform', v)} />
        </div>

        {/* Activity Type */}
        <div className="flex flex-col gap-3">
          <span className="label">How do you mostly use social media?</span>
          <ChipGroup
            options={[
              { value: 'Active',  label: '🗣 Active — I post, comment, and engage' },
              { value: 'Passive', label: '👀 Passive — I mostly scroll and watch' },
            ]}
            value={form.activityType}
            onChange={v => set('activityType', v)}
          />
        </div>

        {/* Dominant Content Type */}
        <div className="flex flex-col gap-3">
          <span className="label">What content do you consume most?</span>
          <ChipGroup options={CONTENT_TYPES} value={form.contentType} onChange={v => set('contentType', v)} />
        </div>

        {/* User Archetype */}
        <div className="flex flex-col gap-3">
          <span className="label">Which best describes your digital style?</span>
          <div className="flex flex-col gap-2">
            {ARCHETYPES.map(a => (
              <button
                key={a.value} type="button"
                onClick={() => set('archetype', a.value)}
                className={`text-left px-4 py-3 rounded-lg border transition-all duration-150
                  ${form.archetype === a.value
                    ? 'bg-accent-dim border-accent/40'
                    : 'bg-bg border-border hover:border-border-strong'}`}
              >
                <p className={`text-sm font-medium ${form.archetype === a.value ? 'text-accent' : 'text-text'}`}>
                  {a.label}
                </p>
                <p className="text-xs text-muted mt-0.5">{a.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Toggles */}
        <div className="flex flex-col divide-y divide-border border-t border-b border-border">
          <div className="flex items-center justify-between py-4">
            <div>
              <p className="text-sm font-medium text-text">Late Night Usage</p>
              <p className="text-xs text-muted mt-0.5">Do you regularly use your phone after midnight?</p>
            </div>
            <Toggle value={form.lateNight} onChange={v => set('lateNight', v)} />
          </div>
          <div className="flex items-center justify-between py-4">
            <div>
              <p className="text-sm font-medium text-text">Social Comparison</p>
              <p className="text-xs text-muted mt-0.5">Do you compare yourself to others online?</p>
            </div>
            <Toggle value={form.socialComparison} onChange={v => set('socialComparison', v)} />
          </div>
        </div>

        {/* Error */}
        {error && (
          <p className="text-xs text-danger flex items-start gap-1.5">
            <span className="w-1 h-1 rounded-full bg-danger shrink-0 mt-1.5" />
            {error}
          </p>
        )}

        {/* Submit */}
        <button
          id="quiz-analyze"
          onClick={handleAnalyze}
          disabled={loading}
          className="btn w-full py-3.5 text-base mt-1"
        >
          {loading
            ? <><SpinnerIcon /> Analyzing your profile…</>
            : <>Analyze My Habits <ArrowRight /></>}
        </button>
      </div>
    </div>
  )
}
