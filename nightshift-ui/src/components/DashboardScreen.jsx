import { useState, useEffect, useCallback } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine,
  PieChart, Pie, Cell, ScatterChart, Scatter, CartesianGrid, Legend,
} from 'recharts'
import { fetchAnalytics } from '../api'

// ── Design tokens ──────────────────────────────────────────────────────────
const C = {
  bg:       '#FFFFFF',
  surface:  '#F9FAFB',
  surfaceHover: '#F3F4F600',
  card:     '#FFFFFF',
  border:   '#E5E7EB',
  borderHover: '#D1D5DB',
  text:     '#111827',
  muted:    '#6B7280',
  subtle:   '#D1D5DB',
  blue:     '#3B82F6',
  blueDim:  '#3B82F610',
  teal:     '#06B6D4',
  red:      '#F59E0B',
  redDim:   '#F59E0B10',
}

const PLATFORMS  = ['Facebook','Instagram','LinkedIn','Snapchat','TikTok','Twitter/X','YouTube']
const AGE_GROUPS = ['Early College','Mid College','Senior']

function screenBucket(h) {
  if (h <= 3) return 'Low'
  if (h <= 6) return 'Moderate'
  if (h <= 9) return 'High'
  return 'Very High'
}
function sleepBucket(h) {
  if (h < 5) return 'Poor Sleep'
  if (h < 7) return 'Moderate Sleep'
  return 'Healthy Sleep'
}

// ── Custom Tooltip ─────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: '#FFFFFF', border: `1px solid ${C.border}`, borderRadius: 10,
      padding: '10px 14px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
    }}>
      {label && <div style={{ fontSize: 11, color: C.muted, marginBottom: 6 }}>{label}</div>}
      {payload.map((p, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.fill || p.color, flexShrink: 0 }} />
          <span style={{ fontSize: 12, color: C.text, fontWeight: 600 }}>{typeof p.value === 'number' ? p.value.toFixed(2) : p.value}</span>
          <span style={{ fontSize: 11, color: C.muted }}>{p.name}</span>
        </div>
      ))}
    </div>
  )
}

// ── Card ───────────────────────────────────────────────────────────────────
const Card = ({ children, style }) => (
  <div style={{
    background: C.card, border: `1px solid ${C.border}`, borderRadius: 16,
    padding: '1.25rem', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', ...style,
  }}>
    {children}
  </div>
)

// ── Chart header ───────────────────────────────────────────────────────────
const ChartHeader = ({ title, subtitle }) => (
  <div style={{ marginBottom: 16 }}>
    <div style={{ fontSize: '0.78rem', fontWeight: 600, color: C.text, letterSpacing: '-0.01em' }}>{title}</div>
    {subtitle && <div style={{ fontSize: '0.68rem', color: C.muted, marginTop: 2 }}>{subtitle}</div>}
  </div>
)

// ── Section label ──────────────────────────────────────────────────────────
const SectionLabel = ({ children }) => (
  <div style={{
    fontSize: '0.62rem', fontWeight: 700, color: C.muted,
    textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10,
  }}>{children}</div>
)

// ── Filter chip ────────────────────────────────────────────────────────────
const Chip = ({ label, active, onClick }) => (
  <button onClick={onClick} style={{
    padding: '0.3rem 0.7rem', borderRadius: 20, fontSize: '0.72rem', cursor: 'pointer',
    border: `1px solid ${active ? C.blue : C.border}`,
    background: active ? C.blueDim : 'transparent',
    color: active ? C.blue : C.muted,
    fontFamily: '"Figtree", system-ui, sans-serif',
    transition: 'all 0.15s ease', outline: 'none',
  }}>{label}</button>
)

// ── Radio item ─────────────────────────────────────────────────────────────
const RadioItem = ({ label, active, onClick }) => (
  <div onClick={onClick} style={{
    display: 'flex', alignItems: 'center', gap: 9, cursor: 'pointer',
    padding: '0.35rem 0.5rem', borderRadius: 8, transition: 'background 0.1s',
    background: active ? C.blueDim : 'transparent',
  }}>
    <div style={{
      width: 14, height: 14, borderRadius: '50%', flexShrink: 0,
      border: `2px solid ${active ? C.blue : C.border}`,
      background: active ? C.blue : 'transparent',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      transition: 'all 0.15s',
    }}>
      {active && <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#fff' }} />}
    </div>
    <span style={{ fontSize: '0.73rem', color: active ? C.text : C.muted, userSelect: 'none' }}>{label}</span>
  </div>
)

// ── KPI Card ───────────────────────────────────────────────────────────────
const KpiCard = ({ label, avg, userVal, userLabel, accent = C.blue }) => (
  <div style={{
    flex: 1, minWidth: 110, background: C.card, border: `1px solid ${C.border}`,
    borderRadius: 16, padding: '1.1rem 1rem', position: 'relative', overflow: 'hidden',
  }}>
    <div style={{
      position: 'absolute', top: 0, left: 0, right: 0, height: 2,
      background: `linear-gradient(90deg, ${accent}00, ${accent}, ${accent}00)`,
    }} />
    <div style={{ fontSize: '0.62rem', fontWeight: 600, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>
      {label}
    </div>
    <div style={{ fontSize: '1.65rem', fontWeight: 700, color: C.text, lineHeight: 1, letterSpacing: '-0.02em' }}>
      {avg}
    </div>
    <div style={{ fontSize: '0.63rem', color: C.muted, marginTop: 4 }}>dataset avg</div>

    {userVal != null && (
      <div style={{
        marginTop: 12, paddingTop: 12, borderTop: `1px solid ${C.border}`,
        display: 'flex', alignItems: 'baseline', gap: 6,
      }}>
        <div style={{ fontSize: '1.1rem', fontWeight: 700, color: C.red, letterSpacing: '-0.01em' }}>{userVal}</div>
        <div style={{ fontSize: '0.62rem', color: C.red, opacity: 0.7 }}>{userLabel || 'you'}</div>
      </div>
    )}
  </div>
)

// ── Legend dot ─────────────────────────────────────────────────────────────
const LegendDot = ({ color, label }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.72rem', color: C.muted }}>
    <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
    {label}
  </div>
)

// ── Gradient defs (reused per chart) ───────────────────────────────────────
const GradientDefs = () => (
  <defs>
    <linearGradient id="gBlue" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.85} />
      <stop offset="100%" stopColor="#60A5FA" stopOpacity={0.65} />
    </linearGradient>
    <linearGradient id="gRed" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.85} />
      <stop offset="100%" stopColor="#FBBF24" stopOpacity={0.65} />
    </linearGradient>
    <linearGradient id="gTeal" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stopColor="#06B6D4" stopOpacity={0.85} />
      <stop offset="100%" stopColor="#22D3EE" stopOpacity={0.65} />
    </linearGradient>
    <linearGradient id="gBlueV" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.2} />
      <stop offset="100%" stopColor="#3B82F6" stopOpacity={0.02} />
    </linearGradient>
  </defs>
)

const axisProps = {
  tick: { fill: C.muted, fontSize: 10, fontFamily: '"Figtree", system-ui, sans-serif' },
  axisLine: false, tickLine: false,
}

// ── Main ───────────────────────────────────────────────────────────────────
export default function DashboardScreen({ userAssessment, onNext, onRetest }) {
  const [filters, setFilters] = useState({ gender: null, platform: null, activityType: null, ageGroup: null })
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try { setData(await fetchAnalytics(filters)) }
    catch (e) { console.error(e) }
    finally   { setLoading(false) }
  }, [filters])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (loading || !data) return;
    const divElement = document.getElementById('viz1777009923241');
    if (!divElement) return;
    
    if (document.getElementById('tableau-inject-script')) return;

    const vizElement = divElement.getElementsByTagName('object')[0];
    if ( divElement.offsetWidth > 800 ) { vizElement.style.minWidth='720px';vizElement.style.maxWidth='1580px';vizElement.style.width='100%';vizElement.style.minHeight='887px';vizElement.style.maxHeight='987px';vizElement.style.height=(divElement.offsetWidth*0.75)+'px';} else if ( divElement.offsetWidth > 500 ) { vizElement.style.minWidth='720px';vizElement.style.maxWidth='1580px';vizElement.style.width='100%';vizElement.style.minHeight='887px';vizElement.style.maxHeight='987px';vizElement.style.height=(divElement.offsetWidth*0.75)+'px';} else { vizElement.style.width='100%';vizElement.style.height='2777px';}                     
    const scriptElement = document.createElement('script');
    scriptElement.id = 'tableau-inject-script';
    scriptElement.src = 'https://public.tableau.com/javascripts/api/viz_v1.js';
    vizElement.parentNode.insertBefore(scriptElement, vizElement);
  }, [loading, data]);

  const toggle = (k, v) => setFilters(f => ({ ...f, [k]: f[k] === v ? null : v }))
  const reset  = ()     => setFilters({ gender: null, platform: null, activityType: null, ageGroup: null })

  const u = userAssessment
  const userCombinedMH = u ? +(u.phq9_score + u.gad7_score).toFixed(2) : null
  const userLateNight  = u?.late_night       != null ? (u.late_night === 1 ? 'Yes' : 'No')       : null
  const userActivity   = u?.activity_type    || null
  const userSocial     = u?.social_comparison != null ? (u.social_comparison === 1 ? 'Yes' : 'No') : null

  const activeFilters = Object.values(filters).filter(Boolean).length

  return (
    <div style={{
      minHeight: '100dvh', display: 'flex', flexDirection: 'column',
      fontFamily: '"Figtree", system-ui, sans-serif', background: C.bg, color: C.text,
    }}>

      {/* ── Top bar ── */}
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 1.5rem', height: 56, borderBottom: `1px solid ${C.border}`,
        background: `${C.bg}CC`, backdropFilter: 'blur(12px)',
        position: 'sticky', top: 0, zIndex: 10, flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: C.text }}>Population Insights</span>
            <span style={{ fontSize: '0.72rem', color: C.muted, marginLeft: 10 }}>8,000 users · social media & mental health</span>
          </div>
          {activeFilters > 0 && (
            <div style={{
              fontSize: '0.68rem', padding: '0.2rem 0.6rem', borderRadius: 20,
              background: C.blueDim, color: C.blue, border: `1px solid ${C.blue}30`,
            }}>
              {activeFilters} filter{activeFilters > 1 ? 's' : ''} active
            </div>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {u && (
            <div style={{ display: 'flex', gap: 14 }}>
              <LegendDot color={C.blue} label="Dataset" />
              <LegendDot color={C.red}  label="You" />
            </div>
          )}
          {onRetest && (
            <button onClick={onRetest} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '0.45rem 1rem', borderRadius: 10, fontSize: '0.8rem', fontWeight: 600,
              cursor: 'pointer',
              background: '#F9FAFB', color: C.text, border: `1px solid ${C.border}`,
              fontFamily: '"Figtree", system-ui, sans-serif', transition: 'all 0.15s ease',
            }}
            onMouseOver={e => e.currentTarget.style.background = '#F3F4F6'}
            onMouseOut={e => e.currentTarget.style.background = '#F9FAFB'}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
              </svg>
              Retest
            </button>
          )}
          <button onClick={onNext} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '0.45rem 1rem', borderRadius: 10, fontSize: '0.8rem', fontWeight: 600,
            cursor: 'pointer', border: 'none',
            background: '#2563EB',
            color: '#fff', fontFamily: '"Figtree", system-ui, sans-serif',
            boxShadow: '0 2px 8px rgba(37,99,235,0.25)',
          }}>
            Talk to Luna
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </button>
        </div>
      </header>

      {/* ── Body ── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>


        {/* ── Main content ── */}
        <main style={{ flex: 1, padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {loading || !data ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                border: `2px solid ${C.border}`, borderTopColor: C.blue,
                animation: 'spin 0.8s linear infinite',
              }} />
              <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
              <span style={{ fontSize: '0.8rem', color: C.muted }}>Loading data…</span>
            </div>
          ) : (<>

            {/* ── Scatter ── */}
            <Card>
              <ChartHeader
                title="Screen Time vs Combined Mental Health Score"
                subtitle="Each dot is a user · PHQ-9 + GAD-7 combined"
              />
              <ResponsiveContainer width="100%" height={300}>
                <ScatterChart margin={{ left: 4, right: 24, top: 4, bottom: 44 }}>
                  <defs>
                    <radialGradient id="scatterGrad" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor={C.blue} stopOpacity={0.8} />
                      <stop offset="100%" stopColor={C.blue} stopOpacity={0.1} />
                    </radialGradient>
                  </defs>
                  <CartesianGrid stroke={C.border} strokeDasharray="4 4" strokeOpacity={0.6} />
                  <XAxis dataKey="screen_time" name="Screen Time" type="number" domain={[0, 12]}
                    {...axisProps}
                    label={{ value: 'Daily Screen Time (hrs)', position: 'insideBottom', offset: -8, fill: C.muted, fontSize: 10 }} />
                  <YAxis dataKey="combined_mh" name="MH Score" type="number" {...axisProps} />
                  <Tooltip content={({ active, payload }) => {
                    if (!active || !payload?.length) return null
                    const d = payload[0]?.payload
                    return (
                      <div style={{
                        background: '#FFFFFF', border: `1px solid ${C.border}`,
                        borderRadius: 10, padding: '10px 14px',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                      }}>
                        <div style={{ fontSize: 11, color: C.text, fontWeight: 600 }}>Screen: {d?.screen_time}h</div>
                        <div style={{ fontSize: 11, color: C.muted }}>MH Score: {d?.combined_mh}</div>
                      </div>
                    )
                  }} cursor={{ strokeDasharray: '3 3' }} />
                  <Legend iconType="circle" iconSize={8}
                    formatter={v => <span style={{ fontSize: 11, color: C.muted }}>{v}</span>} />
                  <Scatter name="Dataset users" data={data.scatter} fill={C.blue} fillOpacity={0.35} />
                  {u?.screen_time != null && userCombinedMH != null && (
                    <Scatter
                      name="You"
                      data={[{ screen_time: u.screen_time, combined_mh: userCombinedMH }]}
                      fill={C.red} fillOpacity={1}
                      shape={(props) => {
                        const { cx, cy } = props
                        return (
                          <g>
                            <circle cx={cx} cy={cy} r={10} fill={C.red} fillOpacity={0.2} />
                            <circle cx={cx} cy={cy} r={5}  fill={C.red} fillOpacity={1} />
                          </g>
                        )
                      }}
                    />
                  )}
                </ScatterChart>
              </ResponsiveContainer>
            </Card>

            {/* ── Tableau Dashboard ── */}
            <Card style={{ padding: 0, overflow: 'hidden' }}>
              <div className='tableauPlaceholder' id='viz1777009923241' style={{position: 'relative'}}>
                <noscript>
                  <a href='#'><img alt='Dashboard 1 ' src='https://public.tableau.com/static/images/Mi/MindMetrics/Dashboard1/1_rss.png' style={{border: 'none'}} /></a>
                </noscript>
                <object className='tableauViz' style={{display:'none'}}>
                  <param name='host_url' value='https%3A%2F%2Fpublic.tableau.com%2F' /> 
                  <param name='embed_code_version' value='3' /> 
                  <param name='site_root' value='' />
                  <param name='name' value='MindMetrics&#47;Dashboard1' />
                  <param name='tabs' value='no' />
                  <param name='toolbar' value='yes' />
                  <param name='static_image' value='https://public.tableau.com/static/images/Mi/MindMetrics/Dashboard1/1.png' /> 
                  <param name='animate_transition' value='yes' />
                  <param name='display_static_image' value='yes' />
                  <param name='display_spinner' value='yes' />
                  <param name='display_overlay' value='yes' />
                  <param name='display_count' value='yes' />
                  <param name='language' value='en-US' />
                  <param name='filter' value='publish=yes' />
                </object>
              </div>
            </Card>

          </>)}
        </main>
      </div>
    </div>
  )
}
