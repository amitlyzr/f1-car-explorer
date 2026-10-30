// Writes public/models/credits.json (shown in the site footer) from the licence records that
// fetch-models.mjs saved next to each download. Lists only the sources the built models use.
//
//   node scripts/credits.mjs
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

const USED = [
  {
    slot: 'car-w17',
    usedFor: 'Car exterior (W17, default)',
    note: 'Its part and material names match F1 game / sim-racing mod files, so its origin may not be the uploader’s own work.',
  },
  { slot: 'car-w14', usedFor: 'Car exterior (W14 alternative)' },
  { slot: 'engine', usedFor: 'Engine (ICE) — a 1991–92 Honda F1 V6 twin-turbo, standing in for the 2026 unit' },
  { slot: 'turbo-alt', usedFor: 'Turbocharger' },
  { slot: 'mguk', usedFor: 'MGU-K — an industrial electric motor, standing in for the F1 unit' },
  { slot: 'battery-cell', usedFor: 'Energy Store — 440 Li-ion cells built into a module' },
  { slot: 'gearbox', usedFor: 'Gearbox — hypoid gear set (with its animation)' },
  { slot: 'ce', usedFor: 'Control Electronics — electrical enclosure, standing in for the F1 unit' },
  { slot: 'radiator', usedFor: 'Sidepod radiators' },
  { slot: 'brakes', usedFor: 'Brake disc and caliper (×4)' },
]

const credits = USED.map(({ slot, usedFor, note }) => {
  const s = JSON.parse(readFileSync(join(root, '..', 'model-sources', slot, 'source.json'), 'utf8'))
  return {
    usedFor,
    title: s.title,
    author: s.author,
    authorUrl: s.authorUrl,
    url: s.url,
    licence: s.licence === 'CC Attribution' ? 'CC BY 4.0' : s.licence,
    licenceUrl: s.licenceUrl,
    ...(note ? { note } : {}),
  }
})

writeFileSync(
  join(root, 'public/models/credits.json'),
  JSON.stringify(
    {
      changes:
        'Models were re-oriented and scaled to metres, split into selectable parts by material and position (wing flaps separated so they can move), simplified where very dense, given metal finishes where untextured, re-encoded with WebP textures and meshopt compression. The fuel cell is modelled by hand: no openly licensed model of one exists.',
      credits,
    },
    null,
    2,
  ),
)
const md = [
  '# 3D model attribution',
  '',
  'The files in this folder are adapted from these Creative Commons Attribution models (CC BY 4.0,',
  'https://creativecommons.org/licenses/by/4.0/). No endorsement by the authors, Mercedes-AMG PETRONAS F1,',
  'Formula 1 or the FIA is implied.',
  '',
  ...credits.flatMap((c) => [
    `- **${c.title}** by ${c.author}: ${c.url} (${c.licence}). Used for: ${c.usedFor}.${c.note ? ` Note: ${c.note}` : ''}`,
  ]),
  '',
  '## Changes',
  '',
  JSON.parse(readFileSync(join(root, 'public/models/credits.json'), 'utf8')).changes,
  '',
  'Regenerate with `npm run models` (needs SKETCHFAB_API_TOKEN for the downloads).',
  '',
].join('\n')
writeFileSync(join(root, 'public/models/ATTRIBUTION.md'), md)
console.log(`wrote public/models/credits.json and ATTRIBUTION.md (${credits.length} sources)`)
