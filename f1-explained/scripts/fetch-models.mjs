// Downloads the Sketchfab sources listed in scripts/assets.json into ../model-sources/<slot>/ (raw, untrusted,
// git-ignored) and records each model's licence metadata next to it. Needs SKETCHFAB_API_TOKEN.
//
//   node scripts/fetch-models.mjs [slot ...]
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const { models } = JSON.parse(readFileSync(join(root, 'scripts/assets.json'), 'utf8'))
const token = process.env.SKETCHFAB_API_TOKEN
if (!token) {
  console.error('SKETCHFAB_API_TOKEN is not set')
  process.exit(1)
}
const only = process.argv.slice(2)
const OPEN = ['CC Attribution', 'CC0 Public Domain']

for (const m of models) {
  if (!m.use || (only.length && !only.includes(m.slot))) continue
  const dir = join(root, '..', 'model-sources', m.slot)
  if (existsSync(join(dir, 'source.json'))) {
    console.log(`= ${m.slot}: already downloaded`)
    continue
  }
  const meta = await (await fetch(`https://api.sketchfab.com/v3/models/${m.uid}`)).json()
  const licence = meta.license?.label
  if (!OPEN.includes(licence)) {
    console.error(`! ${m.slot}: licence is "${licence}", skipping`)
    continue
  }
  const res = await fetch(`https://api.sketchfab.com/v3/models/${m.uid}/download`, {
    headers: { Authorization: `Token ${token}` },
  })
  if (!res.ok) {
    console.error(`! ${m.slot}: download API answered ${res.status} ${await res.text()}`)
    continue
  }
  const links = await res.json()
  const pick = links.glb ? { ...links.glb, kind: 'glb' } : { ...links.gltf, kind: 'gltf' }
  mkdirSync(dir, { recursive: true })
  const file = join(dir, pick.kind === 'glb' ? 'model.glb' : 'model.zip')
  const bin = Buffer.from(await (await fetch(pick.url)).arrayBuffer())
  writeFileSync(file, bin)
  // unzip refuses entries that escape the target directory
  if (pick.kind === 'gltf') execFileSync('unzip', ['-q', '-o', file, '-d', join(dir, 'gltf')])
  writeFileSync(
    join(dir, 'source.json'),
    JSON.stringify(
      {
        slot: m.slot,
        role: m.role,
        uid: m.uid,
        title: meta.name,
        author: meta.user?.displayName || meta.user?.username,
        authorUrl: meta.user?.profileUrl,
        url: meta.viewerUrl,
        licence,
        licenceUrl: meta.license?.url,
        faces: meta.faceCount,
        format: pick.kind,
        bytes: bin.length,
        downloaded: new Date().toISOString(),
      },
      null,
      2,
    ),
  )
  console.log(`+ ${m.slot}: ${meta.name} by ${meta.user?.username} (${licence}), ${(bin.length / 1e6).toFixed(1)} MB ${pick.kind}`)
}
