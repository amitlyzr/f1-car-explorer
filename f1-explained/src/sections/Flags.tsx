import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { FLAGS, type FlagPattern } from '../data/content'

function FlagArt({ p }: { p: FlagPattern }) {
  const W = 120
  const H = 80
  const clip = useId()
  let inner: ReactNode
  switch (p.kind) {
    case 'solid':
      inner = <rect width={W} height={H} fill={p.color} />
      break
    case 'double':
      inner = (
        <>
          <rect width={W} height={H} fill="var(--flag-black)" />
          <rect width={54} height={H} fill={p.color} />
          <rect x={66} width={54} height={H} fill={p.color} />
        </>
      )
      break
    case 'diagonal':
      inner = (
        <>
          <rect width={W} height={H} fill={p.b} />
          <polygon points={`0,0 ${W},0 0,${H}`} fill={p.a} />
        </>
      )
      break
    case 'disc':
      inner = (
        <>
          <rect width={W} height={H} fill={p.bg} />
          <circle cx={W / 2} cy={H / 2} r={22} fill={p.disc} />
        </>
      )
      break
    case 'stripes':
      inner = (
        <>
          <rect width={W} height={H} fill={p.a} />
          {Array.from({ length: 5 }, (_, i) => (
            <rect key={i} x={i * 24 + 12} width={12} height={H} fill={p.b} />
          ))}
        </>
      )
      break
    case 'check':
      inner = (
        <>
          <rect width={W} height={H} fill="var(--flag-white)" />
          {Array.from({ length: 6 * 4 }, (_, i) => {
            const cx = i % 6
            const cy = Math.floor(i / 6)
            return (cx + cy) % 2 ? null : <rect key={i} x={cx * 20} y={cy * 20} width={20} height={20} fill="var(--flag-black)" />
          })}
        </>
      )
      break
    case 'board':
      inner = (
        <>
          <rect width={W} height={H} fill={p.bg} />
          <text x={W / 2} y={H / 2 + 12} textAnchor="middle" fill={p.fg} className="flag-board-text">
            {p.text}
          </text>
        </>
      )
      break
  }
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="flag-svg" aria-hidden>
      <defs>
        <clipPath id={clip}>
          <rect width={W} height={H} rx={2} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${CSS.escape(clip)})`}>{inner}</g>
      <rect width={W} height={H} rx={2} fill="none" className="flag-edge" />
    </svg>
  )
}

type Phase = 'idle' | 'lighting' | 'armed' | 'done' | 'jump'

function StartLights() {
  const [lit, setLit] = useState(0)
  const [phase, setPhase] = useState<Phase>('idle')
  const [ms, setMs] = useState<number | null>(null)
  const [best, setBest] = useState<number | null>(null)
  const timers = useRef<number[]>([])
  const goAt = useRef(0)

  const clear = () => {
    timers.current.forEach(clearTimeout)
    timers.current = []
  }
  useEffect(() => clear, [])

  const start = () => {
    clear()
    setMs(null)
    setLit(0)
    setPhase('lighting')
    for (let i = 1; i <= 5; i++) timers.current.push(window.setTimeout(() => setLit(i), i * 1000))
    const hold = 5000 + 200 + Math.random() * 2800
    timers.current.push(
      window.setTimeout(() => {
        setLit(0)
        setPhase('armed')
        goAt.current = performance.now()
      }, hold),
    )
  }

  const react = () => {
    if (phase === 'lighting') {
      clear()
      setPhase('jump')
      setLit(0)
      return
    }
    if (phase === 'armed') {
      const t = Math.round(performance.now() - goAt.current)
      setMs(t)
      setBest((b) => (b === null || t < b ? t : b))
      setPhase('done')
      return
    }
    start()
  }

  const msg = {
    idle: 'Press start, then react the moment the lights go out.',
    lighting: 'Wait for it…',
    armed: 'GO!',
    done: ms !== null ? `${ms} ms${ms < 200 ? ', F1 reflexes' : ms < 300 ? ', solid start' : ', bogged down'}` : '',
    jump: 'Jump start! That’s a penalty. Press to try again.',
  }[phase]

  return (
    <div className="lights">
      <div className="lights-copy">
        <div className="card-kicker">Race start</div>
        <h3 className="card-title">Five red lights</h3>
        <p className="muted">
          The five red lights come on one per second. After a random pause they all go out together, and that is the
          start. Moving before then is a jump start and a penalty. For 2026 there is a new pre-start warning plus five
          seconds to build revs before the first light comes on.
        </p>
        <div className="lights-score mono">
          <span>{msg}</span>
          {best !== null && <span className="muted">Best: {best} ms</span>}
        </div>
      </div>
      <button className={`gantry phase-${phase}`} onClick={react} aria-label="Start lights: press to start or react">
        <div className="gantry-row">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="gantry-pod">
              <span className={`bulb${i < lit ? ' is-lit' : ''}`} />
              <span className={`bulb${i < lit ? ' is-lit' : ''}`} />
            </div>
          ))}
        </div>
        <span className="gantry-cta mono">
          {phase === 'idle' || phase === 'done' || phase === 'jump' ? 'START' : phase === 'armed' ? 'CLICK!' : 'CLICK ON LIGHTS OUT'}
        </span>
      </button>
    </div>
  )
}

export function Flags() {
  return (
    <section className="section" id="flags">
      <header className="section-head">
        <div className="section-num mono">04</div>
        <div>
          <div className="eyebrow">Flags & signals</div>
          <h2 className="section-title">
            Reading the <em>marshals&rsquo; posts.</em>
          </h2>
        </div>
        <p className="section-lede">
          Marshals wave flags and trackside light panels show the same signals. Drivers also see them on their
          steering-wheel display. Every one of them requires the driver to do something.
        </p>
      </header>
      <div className="flags">
        {FLAGS.map((f) => (
          <article key={f.name} className={`flag sev-${f.severity}`}>
            <div className="flag-art">
              <FlagArt p={f.pattern} />
            </div>
            <div className="flag-meta">
              <h3>{f.name}</h3>
              <span className="flag-sev mono">{f.severity}</span>
            </div>
            <p>{f.meaning}</p>
            <p className="flag-do">
              <span className="mono">DRIVER</span> {f.driver}
            </p>
          </article>
        ))}
        <StartLights />
      </div>
    </section>
  )
}
