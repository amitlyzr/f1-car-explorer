import { useMemo, useState } from 'react'
import { CONCEPTS } from '../data/content'

type Mode = 'undercut' | 'overcut'

interface Params {
  gap: number
  deg: number
  warm: number
  delay: number
  traffic: number
}

const PRESETS: Record<Mode, Params> = {
  undercut: { gap: 1.5, deg: 0.12, warm: 0.5, delay: 1, traffic: 0 },
  overcut: { gap: 1.5, deg: 0.04, warm: 1.6, delay: 2, traffic: 1.6 },
}

const LAPS = 8
const START_AGE = 16
const FIRST_STOP = 2

interface Lap {
  lap: number
  you: number
  rival: number
  lead: number
}

/**
 * Lap-time deltas relative to a fresh-tyre baseline. Pit-lane loss is identical for both cars,
 * so it cancels and is left out: the chart shows the gap as it will be once both have stopped.
 */
function simulate(mode: Mode, p: Params) {
  const youStop = mode === 'undercut' ? FIRST_STOP : FIRST_STOP + p.delay
  const rivalStop = mode === 'undercut' ? FIRST_STOP + p.delay : FIRST_STOP
  const firstStop = Math.min(youStop, rivalStop)
  const lapTime = (lap: number, stop: number, pitsFirst: boolean) => {
    if (lap <= stop) return p.deg * (START_AGE + lap)
    const age = lap - stop - 1
    let t = p.deg * age
    if (age === 0) t += p.warm
    if (pitsFirst && lap > firstStop && lap <= firstStop + 2) t += p.traffic
    return t
  }
  const laps: Lap[] = [{ lap: 0, you: 0, rival: 0, lead: -p.gap }]
  let lead = -p.gap
  for (let lap = 1; lap <= LAPS; lap++) {
    const you = lapTime(lap, youStop, mode === 'undercut')
    const rival = lapTime(lap, rivalStop, mode === 'overcut')
    lead += rival - you
    laps.push({ lap, you, rival, lead })
  }
  return { laps, youStop, rivalStop }
}

function Chart({ laps, youStop, rivalStop }: ReturnType<typeof simulate>) {
  const W = 640
  const H = 280
  const pad = { l: 44, r: 16, t: 18, b: 30 }
  const vals = laps.map((l) => l.lead)
  const maxAbs = Math.max(2, ...vals.map(Math.abs)) * 1.15
  const x = (lap: number) => pad.l + (lap / LAPS) * (W - pad.l - pad.r)
  const y = (v: number) => pad.t + ((maxAbs - v) / (2 * maxAbs)) * (H - pad.t - pad.b)
  const path = laps.map((l, i) => `${i ? 'L' : 'M'}${x(l.lap).toFixed(1)},${y(l.lead).toFixed(1)}`).join(' ')
  const area = `${path} L${x(LAPS)},${y(0)} L${x(0)},${y(0)} Z`
  const ticks = [-Math.floor(maxAbs), 0, Math.floor(maxAbs)]
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="chart" role="img" aria-label="Gap to rival by lap">
      <rect x={pad.l} y={pad.t} width={W - pad.l - pad.r} height={y(0) - pad.t} className="chart-ahead" />
      <text x={W - pad.r - 8} y={pad.t + 16} textAnchor="end" className="chart-zone">
        YOU AHEAD
      </text>
      <text x={W - pad.r - 8} y={H - pad.b - 8} textAnchor="end" className="chart-zone">
        YOU BEHIND
      </text>
      {ticks.map((t) => (
        <g key={t}>
          <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} className={t === 0 ? 'chart-zero' : 'chart-grid'} />
          <text x={pad.l - 8} y={y(t) + 4} textAnchor="end" className="chart-axis">
            {t > 0 ? `+${t}` : t}s
          </text>
        </g>
      ))}
      {Array.from({ length: LAPS + 1 }, (_, i) => (
        <text key={i} x={x(i)} y={H - 8} textAnchor="middle" className="chart-axis">
          {i === 0 ? 'start' : `L${i}`}
        </text>
      ))}
      {[
        { lap: youStop, label: 'YOU PIT', cls: 'you' },
        { lap: rivalStop, label: 'RIVAL PITS', cls: 'rival' },
      ].map((s) => (
        <g key={s.cls}>
          <line x1={x(s.lap)} x2={x(s.lap)} y1={pad.t} y2={H - pad.b} className={`chart-pit ${s.cls}`} />
          <text x={x(s.lap) + 5} y={s.cls === 'you' ? pad.t + 32 : pad.t + 48} className={`chart-pitlabel ${s.cls}`}>
            {s.label}
          </text>
        </g>
      ))}
      <path d={area} className="chart-area" />
      <path d={path} className="chart-line" />
      {laps.map((l) => (
        <circle key={l.lap} cx={x(l.lap)} cy={y(l.lead)} r={3.5} className="chart-dot" />
      ))}
    </svg>
  )
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
  hint,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  unit: string
  hint: string
  onChange: (v: number) => void
}) {
  return (
    <label className="slider">
      <span className="slider-row">
        <span>{label}</span>
        <span className="mono">
          {value.toFixed(step < 0.1 ? 2 : step < 1 ? 1 : 0)}
          {unit}
        </span>
      </span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(+e.target.value)} />
      <span className="slider-hint muted">{hint}</span>
    </label>
  )
}

function Lab() {
  const [mode, setMode] = useState<Mode>('undercut')
  const [p, setP] = useState<Params>(PRESETS.undercut)
  const sim = useMemo(() => simulate(mode, p), [mode, p])
  const set = (k: keyof Params) => (v: number) => setP((prev) => ({ ...prev, [k]: v }))
  // judged once both cars have stopped and completed their out-laps
  const settle = Math.max(sim.youStop, sim.rivalStop) + 1
  const final = sim.laps[settle].lead
  const swings = sim.laps.slice(1, settle + 1).map((l, i) => ({ lap: l.lap, d: l.lead - sim.laps[i].lead }))
  const best = swings.reduce((a, b) => (b.d > a.d ? b : a))
  const worst = swings.reduce((a, b) => (b.d < a.d ? b : a))
  const works = final > 0

  const choose = (m: Mode) => {
    setMode(m)
    setP(PRESETS[m])
  }

  return (
    <div className="lab">
      <div className="lab-main">
        <div className="lab-top">
          <div className="seg" role="group" aria-label="Strategy">
            <button className={mode === 'undercut' ? 'is-on' : ''} onClick={() => choose('undercut')}>
              Undercut
            </button>
            <button className={mode === 'overcut' ? 'is-on' : ''} onClick={() => choose('overcut')}>
              Overcut
            </button>
          </div>
          <p className="lab-setup muted">
            {mode === 'undercut'
              ? `You're ${p.gap.toFixed(1)} s behind. You pit at the end of lap ${FIRST_STOP}; your rival reacts ${p.delay} lap${p.delay > 1 ? 's' : ''} later.`
              : `You're ${p.gap.toFixed(1)} s behind. Your rival pits at the end of lap ${FIRST_STOP}; you stay out ${p.delay} more lap${p.delay > 1 ? 's' : ''}.`}
          </p>
        </div>
        <Chart {...sim} />
        <div className={`verdict${works ? ' is-good' : ' is-bad'}`}>
          <div className="verdict-big">
            {works ? `${mode === 'undercut' ? 'Undercut' : 'Overcut'} works` : `${mode === 'undercut' ? 'Undercut' : 'Overcut'} fails`}
            <span className="mono">
              {works ? `+${final.toFixed(2)} s ahead` : `${Math.abs(final).toFixed(2)} s behind`} after both stops
            </span>
          </div>
          <p>
            Biggest gain: lap {best.lap} (+{best.d.toFixed(2)} s
            {best.lap === sim.youStop + 1
              ? ', your out-lap on fresh tyres'
              : best.lap === sim.rivalStop + 1
                ? ', your rival’s slow out-lap'
                : ''}
            ).{' '}
            {worst.d < 0 &&
              `Biggest loss: lap ${worst.lap} (${worst.d.toFixed(2)} s${worst.lap === sim.youStop + 1 ? ', your own out-lap warm-up' : ''}).`}
          </p>
        </div>
      </div>
      <div className="lab-controls">
        <div className="eyebrow">Race conditions</div>
        <Slider label="Starting gap" value={p.gap} min={0.2} max={4} step={0.1} unit=" s" onChange={set('gap')} hint="How far you are behind your rival" />
        <Slider label="Tyre wear" value={p.deg} min={0} max={0.25} step={0.01} unit=" s/lap" onChange={set('deg')} hint="Time lost per lap of tyre age" />
        <Slider label="Out-lap warm-up" value={p.warm} min={0} max={3} step={0.1} unit=" s" onChange={set('warm')} hint="Time lost bringing new tyres up to temperature" />
        <Slider label={mode === 'undercut' ? 'Rival reacts after' : 'You stay out for'} value={p.delay} min={1} max={4} step={1} unit=" laps" onChange={set('delay')} hint="Laps between the two stops" />
        <Slider label="Traffic for first stopper" value={p.traffic} min={0} max={2.5} step={0.1} unit=" s/lap" onChange={set('traffic')} hint="Time lost stuck behind slower cars for 2 laps" />
        <p className="small muted">
          Both cars lose the same ≈ 20 s in the pit lane, so it&rsquo;s left out of the chart. What matters is what happens
          on track around the stops.
        </p>
      </div>
    </div>
  )
}

export function Strategy() {
  return (
    <section className="section" id="strategy">
      <header className="section-head">
        <div className="section-num mono">03</div>
        <div>
          <div className="eyebrow">Race strategy</div>
          <h2 className="section-title">
            Races are won <em>in the pit lane.</em>
          </h2>
        </div>
        <p className="section-lede">
          Overtaking on track is hard, so teams try to gain places in the pits instead. Choose a strategy, adjust the
          conditions, and see whether the move works.
        </p>
      </header>
      <Lab />
      <div className="concepts">
        {CONCEPTS.map((c) => (
          <article key={c.title} className="concept">
            <h3>{c.title}</h3>
            <p className="concept-short">{c.short}</p>
            <p className="muted">{c.body}</p>
            <ul>
              {c.when.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  )
}
