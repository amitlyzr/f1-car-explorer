/* ───────────────────────── 2026 REGULATIONS ───────────────────────── */

export interface Dimension {
  label: string
  before: number
  after: number
  unit: string
  note: string
}

export const DIMENSIONS: Dimension[] = [
  { label: 'Wheelbase (max)', before: 3600, after: 3400, unit: 'mm', note: '−200 mm: shorter, more agile cars' },
  { label: 'Car width', before: 2000, after: 1900, unit: 'mm', note: '−100 mm: more room to race side by side' },
  { label: 'Minimum weight', before: 800, after: 768, unit: 'kg', note: 'Car + driver, without fuel. −32 kg' },
  { label: 'Front tyre width', before: 305, after: 280, unit: 'mm', note: '−25 mm, same 18-inch rims' },
  { label: 'Rear tyre width', before: 405, after: 375, unit: 'mm', note: '−30 mm' },
]

export const POWER = {
  before: { ice: 550, k: 120, label: '2014–2025', h: true },
  after: { ice: 400, k: 350, label: '2026 →', h: false },
}

export interface RegCard {
  kicker: string
  title: string
  body: string
  stat?: string
  statLabel?: string
}

export const REG_CARDS: RegCard[] = [
  {
    kicker: 'Power unit',
    title: 'The MGU-H is gone',
    body: 'The expensive, road-irrelevant heat-recovery motor on the turbo is deleted. That made the rules simpler and cheaper, which helped bring Audi and Ford in, while Honda stayed and Red Bull builds its own engine with Ford.',
    stat: '0',
    statLabel: 'MGU-H units',
  },
  {
    kicker: 'Energy',
    title: 'Twice the recovered energy',
    body: 'The MGU-K can harvest more than double the energy per lap of the old cars. The battery is charged and drained over and over in a single lap, so energy management becomes a core part of driving.',
    stat: '2×+',
    statLabel: 'energy recovered / lap',
  },
  {
    kicker: 'Fuel',
    title: '100 % advanced sustainable fuel',
    body: 'Fuel must come from non-food biomass, municipal waste or carbon captured from the air. It is a “drop-in” fuel that could run in a road car today. Fuel is limited by energy flow (MJ/h) rather than kilograms per hour.',
    stat: '100%',
    statLabel: 'sustainable',
  },
  {
    kicker: 'Aero',
    title: 'Less drag, less dirty air',
    body: 'The floor is flatter, the Venturi tunnels are gone, wheel covers are removed and new bargeboards return. The FIA targeted about 30 % less downforce and 55 % less drag, which is essential when the electric half of the car would otherwise run out of energy on long straights.',
    stat: '−55%',
    statLabel: 'drag (FIA target)',
  },
  {
    kicker: 'Safety',
    title: 'Tougher, even though lighter',
    body: 'A two-stage nose keeps protecting the driver after a first impact. Side-intrusion protection is stronger, roll-hoop load tests are tougher, and lights show marshals whether a car’s high-voltage system is safe to touch.',
    stat: '2-stage',
    statLabel: 'front impact structure',
  },
  {
    kicker: 'Grid',
    title: '11 teams, 22 cars',
    body: 'Cadillac joins as the 11th team. Audi takes over Sauber. Power units come from Mercedes, Ferrari, Honda, Audi and Red Bull Ford. Mercedes supplies its own team plus McLaren, Williams and Alpine.',
    stat: '22',
    statLabel: 'cars on the grid',
  },
  {
    kicker: 'Qualifying',
    title: 'Six out, six out, top ten',
    body: 'With 22 cars, Q1 (18 min) and Q2 (15 min) each eliminate six drivers. The top ten fight it out in a 13-minute Q3.',
    stat: '22 → 16 → 10',
    statLabel: 'Q1 · Q2 · Q3',
  },
  {
    kicker: 'Money',
    title: 'A bigger cost cap',
    body: 'The team budget cap rises from $135 m to $215 m. Most of that increase comes from moving costs that were previously excluded into the cap, not from extra spending. Power-unit makers have their own cap, now $130 m.',
    stat: '$215m',
    statLabel: 'team cost cap',
  },
]

export const DRIVER_MODES = [
  {
    id: 'corner',
    name: 'Corner Mode',
    alias: 'Z-mode',
    tag: 'DEFAULT',
    body: 'Wing flaps closed for maximum downforce. Used everywhere except the marked straights.',
  },
  {
    id: 'straight',
    name: 'Straight Mode',
    alias: 'X-mode',
    tag: 'EVERY LAP',
    body: 'Front and rear flaps open to reduce drag. Available to every driver in “SM” zones on every dry lap, whatever the gap to the car ahead.',
  },
  {
    id: 'overtake',
    name: 'Overtake Mode',
    alias: 'replaces DRS',
    tag: '< 1 s',
    body: 'Within one second of the car ahead at the detection point? On the next lap you get extra electrical power deployment and +0.5 MJ of extra harvest. The new overtaking aid.',
  },
  {
    id: 'boost',
    name: 'Boost',
    alias: 'push-to-pass',
    tag: 'ANYTIME',
    body: 'Press a button for maximum combined ICE + battery power, anywhere on track, to attack or defend. The energy spent has to be harvested back later.',
  },
  {
    id: 'recharge',
    name: 'Recharge',
    alias: 'harvest',
    tag: 'BRAKING · LIFT',
    body: 'The MGU-K harvests under braking, when lifting off, and even at full throttle near the end of straights (“superclipping”), when the car slows slightly as energy goes back into the battery.',
  },
] as const

/* ───────────────────────── STRATEGY ───────────────────────── */

export interface Concept {
  title: string
  short: string
  body: string
  when: string[]
}

export const CONCEPTS: Concept[] = [
  {
    title: 'Undercut',
    short: 'Pit first and use fresh tyres to gain time while your rival is still on old ones.',
    body: 'You stop a lap or more before the car ahead. On fresh tyres your out-lap and the next lap are much faster than their laps on worn tyres. When they pit, they rejoin behind you.',
    when: ['High tyre wear', 'Tyres warm up fast', 'Clean air when you rejoin', 'Gap is small (≈ 1–3 s)'],
  },
  {
    title: 'Overcut',
    short: 'Stay out longer while your rival struggles on cold tyres or in traffic.',
    body: 'Your rival pits first, but their new tyres are slow to warm up, or they rejoin behind slower cars. Meanwhile you push in clean air on tyres that still have some life, then pit and rejoin ahead.',
    when: ['Low tyre wear', 'Hard / cold tyres slow to warm up', 'Rival rejoins in traffic', 'Cold track, street circuits'],
  },
  {
    title: 'Safety-car “cheap stop”',
    short: 'Pitting under a Safety Car or VSC costs roughly half the usual time.',
    body: 'While the field is slowed, the time lost driving through the pit lane shrinks a lot (often from ≈ 20 s to ≈ 10 s). Teams react within seconds. Sometimes a car stays out to gain track position, and that can backfire.',
    when: ['SC / VSC deployed', 'In or near the pit window', 'Rivals can’t all react'],
  },
  {
    title: 'One-stop vs two-stop',
    short: 'Fewer stops means less time in the pits but slower laps on older tyres.',
    body: 'Every stop costs around 18–25 s. A two-stop pays for its extra stop by running faster on fresher tyres. Which is better depends on tyre wear, how hard it is to overtake, and the pit-lane time loss at that track.',
    when: ['High wear → two-stop', 'Hard to overtake → protect track position', 'Long pit lane → fewer stops'],
  },
  {
    title: 'Tyre offset',
    short: 'Run a different tyre age or compound to your rival to get a pace advantage late in the race.',
    body: 'Pitting later than your rival gives you fresher tyres at the end of the race and a pace advantage when it matters most. It is the overcut played out over many laps.',
    when: ['Late-race attack', 'Rival has stopped early'],
  },
  {
    title: 'Energy strategy (2026)',
    short: 'The battery is now a second fuel tank you manage every lap.',
    body: 'Spending energy to attack can leave you without power on the next straight. Defending means saving energy for the right moment. Expect lift-and-coast and harvesting choices to decide battles as often as tyres do.',
    when: ['Overtake Mode within 1 s', 'Boost to defend', 'Recharge before key straights'],
  },
]

/* ───────────────────────── FLAGS ───────────────────────── */

export type FlagPattern =
  | { kind: 'solid'; color: string }
  | { kind: 'double'; color: string }
  | { kind: 'diagonal'; a: string; b: string }
  | { kind: 'disc'; bg: string; disc: string }
  | { kind: 'stripes'; a: string; b: string }
  | { kind: 'check' }
  | { kind: 'board'; text: string; bg: string; fg: string }

export interface Flag {
  name: string
  pattern: FlagPattern
  meaning: string
  driver: string
  severity: 'info' | 'caution' | 'stop' | 'penalty'
}

export const FLAGS: Flag[] = [
  {
    name: 'Green',
    pattern: { kind: 'solid', color: 'var(--flag-green)' },
    meaning: 'Track clear. Shown after a hazard and at the start of a session.',
    driver: 'Racing resumes at full speed. Overtaking is allowed again.',
    severity: 'info',
  },
  {
    name: 'Yellow',
    pattern: { kind: 'solid', color: 'var(--flag-yellow)' },
    meaning: 'Danger ahead: a car or debris near the track.',
    driver: 'Slow down, no overtaking, and be ready to change line.',
    severity: 'caution',
  },
  {
    name: 'Double Yellow',
    pattern: { kind: 'double', color: 'var(--flag-yellow)' },
    meaning: 'Serious danger. The track may be partly blocked or marshals may be on it.',
    driver: 'Slow down a lot and be ready to stop. In qualifying, this ends a flying lap.',
    severity: 'caution',
  },
  {
    name: 'Red',
    pattern: { kind: 'solid', color: 'var(--flag-red)' },
    meaning: 'Session suspended: a big crash, bad weather or a blocked track.',
    driver: 'Slow down and return to the pit lane. Teams may change tyres. The race restarts later.',
    severity: 'stop',
  },
  {
    name: 'Blue',
    pattern: { kind: 'solid', color: 'var(--flag-blue)' },
    meaning: 'A faster car is about to lap you.',
    driver: 'Let it past at the first chance. Ignoring three blue flags brings a penalty.',
    severity: 'info',
  },
  {
    name: 'White',
    pattern: { kind: 'solid', color: 'var(--flag-white)' },
    meaning: 'A slow-moving vehicle is ahead: a recovery truck, a medical car or a slow car.',
    driver: 'Take care and expect a big speed difference.',
    severity: 'caution',
  },
  {
    name: 'Yellow & Red Stripes',
    pattern: { kind: 'stripes', a: 'var(--flag-yellow)', b: 'var(--flag-red)' },
    meaning: 'Slippery surface: oil, water, gravel or debris on the track.',
    driver: 'Expect less grip in this sector.',
    severity: 'caution',
  },
  {
    name: 'Black & White',
    pattern: { kind: 'diagonal', a: 'var(--flag-black)', b: 'var(--flag-white)' },
    meaning: 'A warning for unsporting behaviour, often repeated track-limit offences.',
    driver: 'Final warning: one more offence brings a penalty.',
    severity: 'penalty',
  },
  {
    name: 'Black with Orange Disc',
    pattern: { kind: 'disc', bg: 'var(--flag-black)', disc: 'var(--flag-orange)' },
    meaning: 'The “meatball”: the car has a mechanical problem (loose part, fire, damage).',
    driver: 'Pit immediately for repairs.',
    severity: 'penalty',
  },
  {
    name: 'Black',
    pattern: { kind: 'solid', color: 'var(--flag-black)' },
    meaning: 'Disqualified.',
    driver: 'Return to the pits immediately. Your race is over.',
    severity: 'penalty',
  },
  {
    name: 'Chequered',
    pattern: { kind: 'check' },
    meaning: 'The end of the session or race.',
    driver: 'Complete one cool-down lap and return to parc fermé.',
    severity: 'info',
  },
  {
    name: 'Safety Car',
    pattern: { kind: 'board', text: 'SC', bg: 'var(--flag-yellow)', fg: 'var(--flag-black)' },
    meaning: 'A Safety Car leads the field while an incident is cleared.',
    driver: 'Queue up behind it with no overtaking. Gaps close up, which makes it a good time to pit.',
    severity: 'caution',
  },
  {
    name: 'Virtual Safety Car',
    pattern: { kind: 'board', text: 'VSC', bg: 'var(--flag-yellow)', fg: 'var(--flag-black)' },
    meaning: 'A neutralisation without a physical car. Everyone must slow to a set minimum lap time.',
    driver: 'Stay above the FIA delta time, with no overtaking. Gaps stay roughly the same.',
    severity: 'caution',
  },
]
