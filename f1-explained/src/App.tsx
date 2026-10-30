import { ExplorerProvider } from './state'
import { Explorer } from './sections/Explorer'
import { Regs } from './sections/Regs'
import { Strategy } from './sections/Strategy'
import { Flags } from './sections/Flags'
import { Credits } from './sections/Credits'

const LINKS = [
  ['#car', '01', 'The Car'],
  ['#regs', '02', '2026 Rules'],
  ['#strategy', '03', 'Strategy'],
  ['#flags', '04', 'Flags'],
] as const

export default function App() {
  return (
    <ExplorerProvider>
      <header className="nav">
        <a href="#car" className="brand">
          <span className="brand-mark" aria-hidden />
          <span>
            PIT<b>WALL</b>
          </span>
          <span className="brand-sub mono">F1 · 2026 field guide</span>
        </a>
        <nav className="nav-links">
          {LINKS.map(([href, n, label]) => (
            <a key={href} href={href}>
              <span className="mono">{n}</span>
              {label}
            </a>
          ))}
        </nav>
      </header>
      <main>
        <Explorer />
        <Regs />
        <Strategy />
        <Flags />
      </main>
      <footer className="footer">
        <div>
          <span className="brand-mark" aria-hidden /> PITWALL, an unofficial, educational F1 guide.
        </div>
        <p className="muted">
          Not affiliated with Formula 1, the FIA or the Mercedes-AMG PETRONAS F1 Team. The 3D cars and
          components are community models credited below, not official team CAD. Regulation figures follow the FIA&rsquo;s published 2026
          rules as reported by formula1.com. Some values are approximate, and the FIA can adjust them during the season.
        </p>
        <Credits />
      </footer>
    </ExplorerProvider>
  )
}
