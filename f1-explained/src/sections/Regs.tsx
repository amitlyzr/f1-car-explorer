import { DIMENSIONS, DRIVER_MODES, POWER, REG_CARDS } from '../data/content'
import { useExplorer } from '../state'

function PowerBar({ ice, k, label, h }: { ice: number; k: number; label: string; h: boolean }) {
  const total = ice + k
  return (
    <div className="pbar">
      <div className="pbar-head">
        <span className="mono">{label}</span>
        <span className="mono muted">≈ {total} kW total</span>
      </div>
      <div className="pbar-track">
        <div className="pbar-ice" style={{ width: `${(ice / total) * 100}%` }}>
          ICE {ice} kW
        </div>
        <div className="pbar-k" style={{ width: `${(k / total) * 100}%` }}>
          MGU-K {k}
        </div>
      </div>
      <div className="pbar-foot mono muted">
        {Math.round((ice / total) * 100)} / {Math.round((k / total) * 100)} split · MGU-H {h ? 'fitted' : 'removed'}
      </div>
    </div>
  )
}

export function Regs() {
  const { setAero, select } = useExplorer()
  const showOnCar = (mode: 'corner' | 'straight') => {
    setAero(mode)
    select('rearWing')
    document.getElementById('car')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section className="section" id="regs">
      <header className="section-head">
        <div className="section-num mono">02</div>
        <div>
          <div className="eyebrow">2026 regulations</div>
          <h2 className="section-title">
            A new formula, <em>front to back.</em>
          </h2>
        </div>
        <p className="section-lede">
          2026 is the biggest reset since the hybrid era began in 2014. Chassis and power unit rules changed at the same
          time. The cars are smaller and lighter, their wings move, half their power is electric and their fuel is fully
          sustainable.
        </p>
      </header>

      <div className="regs-top">
        <div className="card">
          <div className="card-kicker">Chassis</div>
          <h3 className="card-title">Smaller, lighter, nimbler</h3>
          <div className="dims">
            {DIMENSIONS.map((d) => (
              <div key={d.label} className="dim">
                <div className="dim-row">
                  <span>{d.label}</span>
                  <span className="mono">
                    <s className="muted">{d.before.toLocaleString()}</s> → <b>{d.after.toLocaleString()}</b> {d.unit}
                  </span>
                </div>
                <div className="dim-track">
                  <div className="dim-before" />
                  <div className="dim-after" style={{ width: `${(d.after / d.before) * 100}%` }} />
                </div>
                <div className="dim-note muted">{d.note}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-kicker">Power unit</div>
          <h3 className="card-title">From 80/20 to 50/50</h3>
          <p className="card-text">
            Combustion power drops by about 150 kW and electric power almost triples. Peak output with the battery
            deploying rises slightly, but half of it now comes from a battery that has to be recharged during the lap.
          </p>
          <PowerBar {...POWER.before} />
          <PowerBar {...POWER.after} />
          <p className="card-text muted small">
            Power figures are approximate. The ICE limit is set by fuel energy flow, not a fixed kW number.
          </p>
        </div>
      </div>

      <div className="modes">
        <div className="modes-head">
          <div>
            <div className="card-kicker">Driver modes</div>
            <h3 className="card-title">DRS is gone. Here&rsquo;s what replaced it.</h3>
          </div>
          <div className="modes-actions">
            <button className="btn" onClick={() => showOnCar('straight')}>
              See Straight Mode on the car ↑
            </button>
          </div>
        </div>
        <div className="modes-grid">
          {DRIVER_MODES.map((m) => (
            <div key={m.id} className={`mode mode-${m.id}`}>
              <div className="mode-tag mono">{m.tag}</div>
              <div className="mode-name">{m.name}</div>
              <div className="mode-alias mono muted">{m.alias}</div>
              <p>{m.body}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="reg-grid">
        {REG_CARDS.map((r) => (
          <article key={r.title} className="reg">
            <div className="card-kicker">{r.kicker}</div>
            {r.stat && (
              <div className="reg-stat">
                {r.stat}
                <span className="mono muted">{r.statLabel}</span>
              </div>
            )}
            <h3 className="reg-title">{r.title}</h3>
            <p>{r.body}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
