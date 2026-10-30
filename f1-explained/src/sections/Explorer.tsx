import { Suspense, lazy } from 'react'
import { CATEGORIES, COMPONENTS, byId, type CarComponent } from '../data/components'
import { useExplorer } from '../state'

const Stage = lazy(() => import('../scene/Stage').then((m) => ({ default: m.Stage })))

const indexOf = (id: string) => COMPONENTS.findIndex((c) => c.id === id)
const num = (id: string) => String(indexOf(id) + 1).padStart(2, '0')

function Index() {
  const { selected, hovered, select, hover } = useExplorer()
  return (
    <nav className="index" aria-label="Car components">
      {CATEGORIES.map((cat) => (
        <div key={cat.id} className="index-group">
          <div className="index-cat">
            <span className="mono">{cat.code}</span> {cat.label}
          </div>
          <ul>
            {COMPONENTS.filter((c) => c.category === cat.id).map((c) => (
              <li key={c.id}>
                <button
                  className={`index-item${selected === c.id ? ' is-selected' : ''}${hovered === c.id ? ' is-hovered' : ''}`}
                  onClick={() => select(selected === c.id ? null : c.id)}
                  onMouseEnter={() => hover(c.id)}
                  onMouseLeave={() => hover(null)}
                >
                  <span className="mono">{num(c.id)}</span>
                  {c.short ?? c.name}
                  {c.internal && <span className="index-tag" title="Under the bodywork: opens X-ray" />}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  )
}

function AeroToggle() {
  const { aero, setAero } = useExplorer()
  return (
    <div className="seg" role="group" aria-label="Active aero mode">
      <button className={aero === 'corner' ? 'is-on' : ''} onClick={() => setAero('corner')}>
        Corner mode
      </button>
      <button className={aero === 'straight' ? 'is-on' : ''} onClick={() => setAero('straight')}>
        Straight mode
      </button>
    </div>
  )
}

function Toolbar() {
  const { xray, setXray, labels, setLabels, select } = useExplorer()
  return (
    <div className="toolbar">
      <AeroToggle />
      <button className={`chip${xray ? ' is-on' : ''}`} onClick={() => setXray(!xray)} aria-pressed={xray}>
        <span className="chip-led" /> X-ray
      </button>
      <button className={`chip${labels ? ' is-on' : ''}`} onClick={() => setLabels(!labels)} aria-pressed={labels}>
        <span className="chip-led" /> Labels
      </button>
      <button className="chip" onClick={() => select(null)}>
        Reset view
      </button>
    </div>
  )
}

function ModelToggle() {
  const { car, setCar } = useExplorer()
  return (
    <div className="stage-model">
      <span className="eyebrow">3D model</span>
      <div className="seg" role="group" aria-label="3D model">
        <button className={car === 'w17' ? 'is-on' : ''} onClick={() => setCar('w17')} title="2026 Mercedes W17">
          W17 · 2026
        </button>
        <button className={car === 'w14' ? 'is-on' : ''} onClick={() => setCar('w14')} title="2023 Mercedes W14">
          W14 · 2023
        </button>
      </div>
    </div>
  )
}

function Overview() {
  const { car } = useExplorer()
  return (
    <div className="panel-body">
      <div className="eyebrow">Spec sheet · 2026</div>
      <h2 className="panel-title">Mercedes-AMG W17</h2>
      {car === 'w14' && (
        <p className="panel-note">
          You&rsquo;re viewing the 2023 W14 model as an alternative. The specs below are the 2026 W17&rsquo;s.
        </p>
      )}
      <p className="panel-tagline">
        The first car built for F1&rsquo;s biggest rule change in a generation: half electric, active wings and
        100&nbsp;% sustainable fuel.
      </p>
      <dl className="specs">
        {[
          ['Power unit', 'Mercedes-AMG 1.6 L V6 turbo hybrid'],
          ['Power split', '≈ 50 % ICE · 50 % electric'],
          ['MGU-K', '350 kW'],
          ['Min. weight', '768 kg'],
          ['Wheelbase', '≤ 3,400 mm'],
          ['Width', '1,900 mm'],
          ['Tyres', 'Pirelli 18″'],
          ['Drivers', 'G. Russell #63 · K. Antonelli #12'],
        ].map(([k, v]) => (
          <div key={k}>
            <dt>{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>
      <div className="howto">
        <div className="eyebrow">How to explore</div>
        <ul>
          <li>
            <b>Click</b> any part of the car or the list to inspect it
          </li>
          <li>
            <b>Drag</b> to orbit, <b>scroll</b> to zoom, <b>right-drag</b> to pan
          </li>
          <li>
            <b>X-ray</b> reveals the power unit under the bodywork
          </li>
          <li>
            Switch <b>Straight mode</b> to watch both wings open
          </li>
        </ul>
      </div>
    </div>
  )
}

function Detail({ c }: { c: CarComponent }) {
  const { select } = useExplorer()
  const i = indexOf(c.id)
  const prev = COMPONENTS[(i - 1 + COMPONENTS.length) % COMPONENTS.length]
  const next = COMPONENTS[(i + 1) % COMPONENTS.length]
  const cat = CATEGORIES.find((k) => k.id === c.category)!
  return (
    <div className="panel-body" key={c.id}>
      <div className="eyebrow">
        <span className="mono">{num(c.id)}</span> · {cat.label}
      </div>
      <h2 className="panel-title">{c.name}</h2>
      <p className="panel-tagline">{c.tagline}</p>
      {(c.id === 'frontWing' || c.id === 'rearWing') && (
        <div className="panel-aero">
          <AeroToggle />
        </div>
      )}
      {c.change2026 && (
        <div className="callout">
          <div className="callout-label">What changed in 2026</div>
          <p>{c.change2026}</p>
        </div>
      )}
      {c.body.map((p, k) => (
        <p key={k} className="panel-text">
          {p}
        </p>
      ))}
      <dl className="specs">
        {c.specs.map(([k, v]) => (
          <div key={k}>
            <dt>{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>
      <div className="panel-nav">
        <button onClick={() => select(prev.id)}>← {prev.name}</button>
        <button onClick={() => select(next.id)}>{next.name} →</button>
      </div>
    </div>
  )
}

function Hud() {
  const { aero, xray, selected } = useExplorer()
  return (
    <div className="hud" aria-hidden>
      <div>
        <span className="hud-k">AERO</span>
        <span className={`hud-v${aero === 'straight' ? ' is-accent' : ''}`}>
          {aero === 'straight' ? 'STRAIGHT · LOW DRAG' : 'CORNER · MAX DOWNFORCE'}
        </span>
      </div>
      <div>
        <span className="hud-k">VIEW</span>
        <span className="hud-v">{xray ? 'X-RAY' : 'BODYWORK'}</span>
      </div>
      <div>
        <span className="hud-k">PART</span>
        <span className="hud-v">{selected ? byId[selected].name.toUpperCase() : '—'}</span>
      </div>
    </div>
  )
}

export function Explorer() {
  const { selected } = useExplorer()
  return (
    <section className="explorer" id="car">
      <Index />
      <div className="stage">
        <div className="stage-head">
          <div className="eyebrow">Interactive · 3D model</div>
          <h1>
            The 2026 F1 car, <em>taken apart.</em>
          </h1>
        </div>
        <Suspense fallback={<div className="stage-loading mono">Loading garage…</div>}>
          <Stage />
        </Suspense>
        <Hud />
        <ModelToggle />
        <Toolbar />
        <span className="tick tl" />
        <span className="tick tr" />
        <span className="tick bl" />
        <span className="tick br" />
      </div>
      <aside className="panel" aria-live="polite">
        {selected ? <Detail c={byId[selected]} /> : <Overview />}
      </aside>
    </section>
  )
}
