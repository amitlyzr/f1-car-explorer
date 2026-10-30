export type Category = 'aero' | 'power' | 'chassis' | 'tyres'

export type Vec3 = [number, number, number]

export interface CarComponent {
  id: string
  name: string
  /** shorter label for the parts list */
  short?: string
  category: Category
  tagline: string
  body: string[]
  change2026?: string
  specs: [string, string][]
  /** Hidden under bodywork: selecting it switches X-ray on. */
  internal?: boolean
  pin: Vec3
  cam: { pos: Vec3; target: Vec3 }
}

export const CATEGORIES: { id: Category; label: string; code: string }[] = [
  { id: 'aero', label: 'Aerodynamics', code: 'AE' },
  { id: 'power', label: 'Power Unit', code: 'PU' },
  { id: 'chassis', label: 'Chassis & Safety', code: 'CH' },
  { id: 'tyres', label: 'Tyres & Brakes', code: 'TB' },
]

export const COMPONENTS: CarComponent[] = [
  // ───────────── AERODYNAMICS ─────────────
  {
    id: 'frontWing',
    name: 'Front Wing',
    category: 'aero',
    tagline: 'The first part of the car to touch the air, and it now moves.',
    body: [
      'The front wing produces roughly a quarter of the car’s downforce and, just as important, sets up the airflow for everything behind it. It steers air around the front tyres (whose wake is very turbulent) and feeds clean air to the floor and sidepods.',
      'It is made of a main plane and a stack of flaps, held between two endplates. Teams change the flap angle at pit stops to tune front-end grip, which shifts the car’s balance between understeer and oversteer.',
    ],
    change2026:
      'Active aero: the upper flaps now pivot. In Straight Mode they flatten to cut drag; in Corner Mode they close back to full downforce. The wing is also about 100 mm narrower and simpler than before.',
    specs: [
      ['Share of downforce', '≈ 25 %'],
      ['Elements', 'Main plane + flaps'],
      ['Moving parts (2026)', 'Upper flaps'],
      ['Material', 'Carbon-fibre composite'],
    ],
    pin: [2.95, 0.3, 0.6],
    cam: { pos: [4.9, 0.9, 2.2], target: [2.6, 0.15, 0] },
  },
  {
    id: 'rearWing',
    name: 'Rear Wing',
    category: 'aero',
    tagline: 'DRS is gone. Every driver now opens the wing on every straight.',
    body: [
      'The rear wing works like an upside-down aircraft wing: it pushes the rear tyres into the track, giving traction and stability under braking and in fast corners. That grip costs drag, which limits top speed.',
      'Until 2025, DRS let a car within one second of the car ahead open a slot in the wing. In 2026 the wing opens for everyone, in designated zones on every lap. That is Straight Mode, and it is now a normal part of a lap rather than an overtaking aid.',
    ],
    change2026:
      'Straight Mode lowers the flap (and the front-wing flaps) on straights marked by “SM” boards. Corner Mode, the default, closes it again for grip. Overtaking help now comes from the power unit instead (Overtake Mode).',
    specs: [
      ['Modes', 'Corner (Z) · Straight (X)'],
      ['Replaces', 'DRS (2011–2025)'],
      ['Zone markers', '“SM” boards'],
      ['Rain light', 'Central LED'],
    ],
    pin: [-2.2, 1.05, 0.45],
    cam: { pos: [-5.2, 1.9, 2.6], target: [-2.1, 0.7, 0] },
  },
  {
    id: 'floor',
    name: 'Floor & Underbody',
    category: 'aero',
    tagline: 'The biggest wing on the car is the one you can’t see.',
    body: [
      'Air sped up under the car drops in pressure, which pulls the car down onto the track. This is ground effect. From 2022 to 2025 the floor used two big Venturi tunnels and produced most of the downforce, but the cars had to run stiff and low, and many bounced on the straights (“porpoising”).',
      'Floor edges, fences and the plank (a wooden skid block that must not wear more than 1 mm) are checked closely by the FIA after every session.',
    ],
    change2026:
      'The floor is now flatter and the big Venturi tunnels are gone. Downforce depends less on ride height, so the cars can run a little softer and higher. The floor is also about 100 mm narrower.',
    specs: [
      ['Plank wear limit', '1 mm'],
      ['Concept (2026)', 'Flatter floor, no Venturi tunnels'],
      ['Downforce (FIA target)', '≈ −30 % vs 2025'],
      ['Drag (FIA target)', '≈ −55 % vs 2025'],
    ],
    pin: [-0.6, 0.06, 0.85],
    cam: { pos: [1.4, 0.45, 4.2], target: [-0.3, 0.05, 0.3] },
  },
  {
    id: 'diffuser',
    name: 'Diffuser',
    category: 'aero',
    tagline: 'Where the underfloor air is let out, and the low pressure is kept.',
    body: [
      'The diffuser is the upswept tail of the floor. As the channel widens, air from under the car slows down and its pressure rises back to normal smoothly. That keeps the flow attached and keeps the low pressure under the floor working.',
      'Its vertical fences (strakes) keep the airflow tidy. The rear wing above it pulls on the diffuser’s air as well, so the two are designed together.',
    ],
    change2026:
      'With a flatter floor, the diffuser does a bigger share of the underbody’s work. Its shape is simpler, which should make the car less sensitive when following another car.',
    specs: [
      ['Location', 'Rear of floor'],
      ['Works with', 'Floor & rear wing'],
      ['Main enemy', 'Flow separation'],
    ],
    pin: [-2.15, 0.28, 0.4],
    cam: { pos: [-4.6, 0.6, 1.6], target: [-2.0, 0.2, 0] },
  },
  {
    id: 'sidepods',
    name: 'Sidepods & Cooling',
    category: 'aero',
    tagline: 'Radiators inside, airflow management outside.',
    body: [
      'The sidepods hold the radiators that cool the engine’s water and oil, the battery and the electronics. Air comes in through the inlets beside the cockpit and leaves through louvres and the gap around the gearbox.',
      'Outside, the shape is all aerodynamics. The undercut and the downwash ramp guide air towards the back of the floor and the diffuser. Bigger cooling openings mean more drag, so teams change bodywork from track to track as the temperature changes.',
    ],
    change2026:
      'With a much bigger electrical side to the power unit, more cooling goes to the battery and electronics, and less heat comes out through the exhaust. Teams had to rethink radiator layouts from scratch.',
    specs: [
      ['Contains', 'Radiators, electronics'],
      ['Cools', 'Water, oil, ES, CE, charge air'],
      ['Trade-off', 'Cooling vs drag'],
    ],
    pin: [0.35, 0.56, 0.62],
    cam: { pos: [1.8, 1.6, 3.6], target: [0.0, 0.35, 0.3] },
  },

  // ───────────── POWER UNIT ─────────────
  {
    id: 'ice',
    name: 'Internal Combustion Engine',
    short: 'Engine (ICE)',
    category: 'power',
    tagline: '1.6-litre turbo V6, now running on fully sustainable fuel.',
    body: [
      'The ICE is a 1.6-litre, 90° V6 with a single turbocharger and a 15,000 rpm limit. It sits behind the driver as a stressed member: the gearbox and rear suspension bolt straight onto it, so the engine carries load as part of the chassis.',
      'Mercedes-AMG High Performance Powertrains builds it in Brixworth, England. For 2026 it supplies the works team plus McLaren, Williams and Alpine.',
    ],
    change2026:
      'Combustion output falls from ≈ 550 kW to ≈ 400 kW, and the electric side rises to match: about a 50/50 split. Fuel is limited by energy flow rather than by mass, and the compression ratio drops from 18:1 to 16:1.',
    specs: [
      ['Layout', '1.6 L V6, 90°, turbo'],
      ['Rev limit', '15,000 rpm'],
      ['Output (2026)', '≈ 400 kW / 540 hp'],
      ['Compression ratio', '16 : 1'],
      ['Fuel', '100 % advanced sustainable'],
    ],
    internal: true,
    pin: [-0.95, 0.55, 0.0],
    cam: { pos: [-0.4, 2.0, 2.6], target: [-0.95, 0.3, 0] },
  },
  {
    id: 'turbo',
    name: 'Turbocharger',
    category: 'power',
    tagline: 'Exhaust energy spins a compressor, and the MGU-H is gone.',
    body: [
      'Hot exhaust gas spins a turbine, which drives a compressor on the same shaft and forces dense air into the engine. More air allows more fuel to be burned, which means more power from a small engine.',
      'From 2014 to 2025 an MGU-H motor sat on the turbo shaft. It recovered energy from the exhaust and spun the turbo up to remove lag. Mercedes famously split the turbo, with the compressor at the front of the engine and the turbine at the back, to package the MGU-H between them.',
    ],
    change2026:
      'The MGU-H has been removed: it was expensive, complex and not relevant to road cars. Turbo lag is back as an engineering problem, which the bigger MGU-K helps hide by filling the torque gap.',
    specs: [
      ['Type', 'Single turbo'],
      ['MGU-H', 'Removed for 2026'],
      ['Driven by', 'Exhaust gas'],
    ],
    internal: true,
    pin: [-1.42, 0.58, 0.0],
    cam: { pos: [-2.4, 1.6, 2.0], target: [-1.35, 0.4, 0] },
  },
  {
    id: 'mguk',
    name: 'MGU-K',
    category: 'power',
    tagline: 'Motor Generator Unit – Kinetic: the 350 kW electric heart of 2026.',
    body: [
      'The MGU-K is an electric motor-generator geared to the crankshaft. Under braking it works as a generator: it turns the rear wheels’ kinetic energy into electricity and slows the car. On acceleration it works as a motor and adds electric power straight to the drivetrain.',
      'Because it brakes the rear axle too, the car needs brake-by-wire: a computer blends the MGU-K’s braking with the carbon brakes so the driver feels a consistent pedal.',
    ],
    change2026:
      'Peak output is almost tripled, from 120 kW to 350 kW (≈ 470 hp). The energy it can recover per lap more than doubles. Drivers will also “superclip”: harvesting at full throttle near the end of long straights.',
    specs: [
      ['Max power (2026)', '350 kW (was 120 kW)'],
      ['Function', 'Harvest + deploy'],
      ['Connected to', 'Crankshaft'],
      ['Energy per lap', 'More than 2× previous'],
    ],
    internal: true,
    pin: [-0.62, 0.22, 0.42],
    cam: { pos: [0.3, 0.9, 2.4], target: [-0.65, 0.18, 0.15] },
  },
  {
    id: 'es',
    name: 'Energy Store (Battery)',
    short: 'Battery (ES)',
    category: 'power',
    tagline: 'A small, very hard-working lithium-ion battery.',
    body: [
      'The Energy Store (ES) holds the electricity the MGU-K harvests. It sits low inside the survival cell, under the fuel tank, where it is best protected and keeps the centre of gravity down.',
      'It is small by road-car standards but works far harder: it is charged and drained hard on every lap. Cooling and managing the cells is a big engineering job. The ES must also stay above a minimum weight, so teams can’t save mass with a tiny pack.',
    ],
    change2026:
      'With 350 kW to supply, energy management decides lap time. Where the driver harvests and where they deploy is planned corner by corner, and a battery that runs out on a straight is a car that can be overtaken.',
    specs: [
      ['Chemistry', 'Lithium-ion'],
      ['Location', 'Under fuel cell'],
      ['Feeds', 'MGU-K (≤ 350 kW)'],
    ],
    internal: true,
    pin: [-0.35, 0.12, 0.38],
    cam: { pos: [0.9, 0.7, 2.2], target: [-0.35, 0.12, 0] },
  },
  {
    id: 'ce',
    name: 'Control Electronics',
    category: 'power',
    tagline: 'The power electronics that run the hybrid system.',
    body: [
      'The Control Electronics (CE) convert and route electricity between the battery and the MGU-K and control how much power flows, and when. Around them sits the FIA-standard ECU, which every team must use. That lets the FIA check that no illegal traction control or driver aids are hidden in software.',
      'The electronics run hot, so they sit low in the sidepod next to their own cooling.',
    ],
    change2026:
      'Far more power passes through the electronics than before. Software for deployment maps, Boost and Overtake Mode is now one of the biggest differences between power unit makers.',
    specs: [
      ['ECU', 'FIA-standard'],
      ['Manages', 'ES ↔ MGU-K power'],
      ['Location', 'Sidepod, low'],
    ],
    internal: true,
    pin: [0.15, 0.3, -0.52],
    cam: { pos: [1.2, 1.1, -2.6], target: [0.1, 0.2, -0.4] },
  },
  {
    id: 'fuel',
    name: 'Fuel Cell',
    category: 'power',
    tagline: 'A puncture-proof bag of 100 % sustainable fuel.',
    body: [
      'The fuel cell is a flexible bladder of Kevlar-reinforced rubber that sits between the driver’s back and the engine, inside the survival cell. Refuelling has been banned since 2010, so a car must start the race with all the fuel it will use.',
      'Mercedes’ fuel is developed with PETRONAS. Teams must keep a fuel sample in the car at the end of a session so the FIA can test it.',
    ],
    change2026:
      'The fuel must now be 100 % “advanced sustainable”: made from waste, non-food biomass or carbon captured from the air, never from crude oil. It is a drop-in fuel, so it works in engines without changes. Race fuel loads are also much lighter than before.',
    specs: [
      ['Construction', 'Kevlar-rubber bladder'],
      ['Refuelling', 'Banned since 2010'],
      ['Fuel (2026)', '100 % sustainable, drop-in'],
    ],
    internal: true,
    pin: [-0.35, 0.62, 0.0],
    cam: { pos: [0.8, 1.9, 2.3], target: [-0.35, 0.35, 0] },
  },
  {
    id: 'gearbox',
    name: 'Gearbox',
    category: 'power',
    tagline: 'Eight gears and seamless shifts in milliseconds.',
    body: [
      'The gearbox has eight forward gears and one reverse. Gear changes are “seamless”: the next gear engages as the last one disengages, so drive to the wheels is barely interrupted.',
      'Its casing is a structural part. The rear suspension, the rear crash structure and the rear wing pylon all mount to it, and the differential inside controls how torque is split between the rear wheels. Drivers adjust the differential from the steering wheel corner by corner.',
    ],
    change2026:
      'The gear ratios still have to be fixed for the season, but they now have to work with a power unit that gets half its power from electricity, which changes the shape of the torque curve.',
    specs: [
      ['Gears', '8 forward + 1 reverse'],
      ['Shift type', 'Seamless'],
      ['Casing', 'Carbon / titanium'],
    ],
    internal: true,
    pin: [-1.7, 0.42, 0.0],
    cam: { pos: [-3.0, 1.3, 2.2], target: [-1.7, 0.3, 0] },
  },

  // ───────────── CHASSIS & SAFETY ─────────────
  {
    id: 'monocoque',
    name: 'Monocoque',
    category: 'chassis',
    tagline: 'The carbon-fibre survival cell the whole car is built around.',
    body: [
      'The monocoque is the car’s core: a single carbon-fibre composite tub that contains the driver, the fuel cell and the battery. The front suspension, the nose and the power unit all bolt onto it.',
      'It must pass FIA crash and load tests before it can race, including impact tests, squeeze tests and penetration tests. Its sides are reinforced with Zylon panels so debris can’t cut through.',
    ],
    change2026:
      'Side-intrusion protection is stronger, and the chassis must pass tougher load tests, even though the whole car got smaller and lighter.',
    specs: [
      ['Material', 'Carbon-fibre composite'],
      ['Side armour', 'Zylon anti-intrusion panels'],
      ['Car min. weight', '768 kg (was 800)'],
    ],
    pin: [0.9, 0.66, 0.3],
    cam: { pos: [2.4, 2.4, 2.8], target: [0.6, 0.35, 0] },
  },
  {
    id: 'halo',
    name: 'Halo',
    category: 'chassis',
    tagline: 'A 7 kg titanium hoop that has already saved lives.',
    body: [
      'Introduced in 2018, the halo is a titanium hoop over the cockpit that protects the driver’s head from flying wheels, debris and other cars. Many disliked it at first. It is now seen as one of the most important safety devices in motorsport.',
      'It is credited with saving Romain Grosjean in his fiery 2020 Bahrain crash, Lewis Hamilton when Max Verstappen’s car landed on his at Monza in 2021, and Zhou Guanyu in his 2022 Silverstone crash.',
    ],
    change2026:
      'The 2026 rules keep the halo and add stronger roll-structure requirements around it.',
    specs: [
      ['Introduced', '2018'],
      ['Material', 'Grade 5 titanium'],
      ['Weight', '≈ 7 kg'],
      ['Load test', '≈ 125 kN (≈ 12 tonnes)'],
    ],
    pin: [0.55, 0.92, 0.0],
    cam: { pos: [1.9, 1.9, 1.5], target: [0.3, 0.75, 0] },
  },
  {
    id: 'rollhoop',
    name: 'Roll Hoop & Airbox',
    category: 'chassis',
    tagline: 'The engine breathes here, and the car rests on it if it flips.',
    body: [
      'The structure above the driver’s head does two jobs. The opening (the airbox) feeds air to the engine’s intake and to some coolers. The carbon/titanium structure around it is the roll hoop, built to hold the car’s weight if it ends up upside down.',
      'The onboard “T-cam”, coloured to show which of the team’s two cars it is, sits on top.',
    ],
    change2026:
      'The roll hoop must survive higher load tests, after crashes such as Zhou’s 2022 Silverstone accident, where the roll hoop failed and the halo did the work.',
    specs: [
      ['Functions', 'Engine air intake, roll protection'],
      ['Load tests', 'Raised for 2026'],
    ],
    pin: [-0.4, 1.06, 0.0],
    cam: { pos: [0.9, 1.9, 1.7], target: [-0.3, 0.8, 0] },
  },
  {
    id: 'nose',
    name: 'Nose & Impact Structure',
    short: 'Nose & Crash Structure',
    category: 'chassis',
    tagline: 'A crumple zone that gives its life for the driver’s.',
    body: [
      'The nose is a crash structure. In a frontal impact it crushes in a controlled way, absorbing energy so the deceleration the driver feels stays survivable. It also holds the front wing.',
      'Its shape matters aerodynamically too: it controls how much air goes under the chassis to the floor.',
    ],
    change2026:
      'There is a new two-stage front impact structure. Part of it stays in place after a first impact, so the car still has protection if it hits again, for example in a multi-car crash.',
    specs: [
      ['Function', 'Energy absorption'],
      ['2026 design', 'Two-stage impact structure'],
    ],
    pin: [2.35, 0.42, 0.0],
    cam: { pos: [4.6, 1.3, 1.6], target: [2.2, 0.25, 0] },
  },
  {
    id: 'suspension',
    name: 'Suspension',
    category: 'chassis',
    tagline: 'Carbon wishbones that control the platform and keep the aero working.',
    body: [
      'Each corner uses a double-wishbone layout: two carbon wishbones (upper and lower) hold the wheel upright. A pushrod or pullrod passes forces to springs and dampers inside the chassis, where they are out of the airflow.',
      'In a modern F1 car the suspension’s main job is keeping the aerodynamic platform stable: holding ride height and rake so the floor and wings work as designed. The wishbones themselves are shaped like small wings.',
    ],
    change2026:
      'With less ground-effect sensitivity, set-ups can be a little softer, which helps the cars ride kerbs and bumps. Active suspension remains banned.',
    specs: [
      ['Layout', 'Double wishbone'],
      ['Actuation', 'Push-rod / pull-rod'],
      ['Active suspension', 'Banned'],
    ],
    pin: [1.6, 0.42, 0.62],
    cam: { pos: [3.0, 1.2, 3.0], target: [1.7, 0.3, 0.5] },
  },
  {
    id: 'cockpit',
    name: 'Cockpit & Steering Wheel',
    short: 'Cockpit & Wheel',
    category: 'chassis',
    tagline: 'The driver’s office, with 20+ controls on the wheel.',
    body: [
      'Drivers lie nearly flat with their feet above their hips. The steering wheel is a carbon computer with a display, rotary switches and buttons that control brake balance, differential, engine maps, radio, pit-lane limiter, and now Boost, Overtake Mode and energy recharge.',
      'Drivers lose several kilos of sweat in a hot race and take up to 5 g under braking. The seat is moulded to each driver’s body.',
    ],
    change2026:
      'Energy management is now a core part of driving. Drivers choose when to Boost, when to use Overtake Mode, and how to lift and coast to recharge, much like managing a resource in a strategy game.',
    specs: [
      ['Controls', '≈ 25 buttons & rotaries'],
      ['Braking load', 'Up to ~5 g'],
      ['New buttons (2026)', 'Boost · Overtake'],
    ],
    pin: [0.15, 0.95, -0.25],
    cam: { pos: [1.4, 1.6, 0.9], target: [0.2, 0.62, 0] },
  },

  // ───────────── TYRES & BRAKES ─────────────
  {
    id: 'tyres',
    name: 'Tyres',
    category: 'tyres',
    tagline: 'The only part of the car touching the track: about four postcards’ worth.',
    body: [
      'Pirelli supplies every team with 18-inch tyres in a range of dry compounds, from hard to soft, plus green-walled intermediates and blue-walled full wets. For each race, three dry compounds are chosen and labelled Soft (red), Medium (yellow) and Hard (white).',
      'Softer compounds are faster but wear out sooner. In a dry race each driver must use at least two different dry compounds, which is why every race has at least one pit stop and why tyre strategy matters so much.',
    ],
    change2026:
      'The tyres are narrower: the fronts lose 25 mm and the rears 30 mm of width. That cuts drag and weight, and gives a little less mechanical grip.',
    specs: [
      ['Supplier', 'Pirelli'],
      ['Rim size', '18 inch'],
      ['Width change (2026)', 'Front −25 mm · Rear −30 mm'],
      ['Race rule', 'Two dry compounds'],
    ],
    pin: [1.9, 0.78, 0.8],
    cam: { pos: [3.6, 0.7, 2.8], target: [1.9, 0.35, 0.8] },
  },
  {
    id: 'brakes',
    name: 'Brakes',
    category: 'tyres',
    tagline: 'Carbon discs glowing at 1,000 °C.',
    body: [
      'F1 brakes use carbon-carbon discs and pads, which work best at very high temperatures (roughly 400–1,000 °C). Each disc has more than a thousand tiny drilled cooling holes. A car can slow from over 300 km/h to around 80 km/h in under 4 seconds.',
      'The rear brakes are brake-by-wire. Because the MGU-K also slows the rear wheels while it harvests, a computer splits the braking between the two so the car stays stable.',
    ],
    change2026:
      'With a 350 kW MGU-K harvesting hard, much more of the rear braking is now done electrically. Getting the brake-by-wire blend right is critical for stability under braking.',
    specs: [
      ['Disc material', 'Carbon-carbon'],
      ['Operating temp', '≈ 400–1,000 °C'],
      ['Rear axle', 'Brake-by-wire'],
      ['Peak decel', '≈ 5 g'],
    ],
    internal: true,
    pin: [-1.5, 0.6, 0.62],
    cam: { pos: [-0.2, 0.8, 2.6], target: [-1.5, 0.35, 0.6] },
  },
]

export const byId = Object.fromEntries(COMPONENTS.map((c) => [c.id, c])) as Record<string, CarComponent>
