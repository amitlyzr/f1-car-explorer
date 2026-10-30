// Turns a downloaded car GLB into the site's car: one node per selectable part (`part:<id>`), in the
// explorer's frame (metres, +x forward, +y up, ground at y = 0, front axle x = 1.9, rear axle x = -1.5),
// with WebP textures and meshopt compression.
//
//   node scripts/build-car.mjs w17|w14 [--debug]
//
// The source cars are modelled as a handful of material-sized meshes, not as mechanical parts, so every
// triangle is assigned to a part by its material and where it sits on the car. Triangles are never moved
// or reshaped; a few are split between neighbours where a source mesh spans two parts.
import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import { dedup, meshopt, prune, textureCompress, weld } from '@gltf-transform/functions'
import { MeshoptEncoder } from 'meshoptimizer'
import sharp from 'sharp'
import { mat4, vec3 } from 'gl-matrix'
import { mkdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const car = process.argv[2]
const debug = process.argv.includes('--debug')

const FRONT_AXLE = 1.9
const REAR_AXLE = -1.5

/* ───────────── per-car part rules ───────────── */

const near = (v, c, r) => Math.abs(v - c) < r

/** Rules shared by both cars once they sit in the explorer frame. `m` is the lower-cased material name. */
function regionRules(p, m) {
  const [x, y, z] = p
  const H = cfg.halo
  const az = Math.abs(z)
  // rear wing: everything high behind the rear axle, and the wing mounts
  if (x < REAR_AXLE - 0.35 && y > 0.5) return 'rearWing'
  // diffuser: low, behind the rear axle line
  if (x < REAR_AXLE - 0.1 && y < 0.5 && az < 0.62) return 'diffuser'
  // front wing: ahead of the front wheels and low
  if (x > FRONT_AXLE + 0.32 && y < 0.36) return 'frontWing'
  if (x > FRONT_AXLE + 0.32 && az > 0.35) return 'frontWing'
  // suspension: the arms between body and wheels
  if (near(x, FRONT_AXLE, 0.42) && az > 0.24 && az < 0.72 && y > 0.12 && y < 0.62) return 'suspension'
  if (near(x, REAR_AXLE, 0.42) && az > 0.22 && az < 0.66 && y > 0.12 && y < 0.62) return 'suspension'
  // nose: the narrow front of the chassis ahead of the cockpit
  if (x > 1.25 && az < 0.3) return 'nose'
  // floor: the low plate (and its edges) between the axles
  if (y < 0.13) return 'floor'
  if (y < 0.2 && az > 0.62) return 'floor'
  // halo: the hoop over the cockpit
  if (y > H.y && x > -0.3 && x < 0.95 && az < 0.42 && !(x < -0.05 && az < 0.2)) return 'halo'
  if (az < 0.07 && x > 0.5 && x < 0.95 && y > H.pylon) return 'halo'
  // roll hoop and airbox: above the driver's head, behind the halo
  if (y > 0.86 && x < 0.0 && x > -0.75 && az < 0.22) return 'rollhoop'
  // sidepods: the flanks between the cockpit and the rear wheels
  if (az > 0.3 && x > -1.2 && x < 1.05) return 'sidepods'
  // engine cover: everything else behind the cockpit (opens onto the power unit)
  if (x < -0.25) return 'ice'
  return 'monocoque'
}

const CARS = {
  w17: {
    src: '../model-sources/car-w17/model.glb',
    out: 'public/models/w17.glb',
    // source: +z forward, y up, real metres
    rotateY: Math.PI / 2,
    scale: 1,
    halo: { y: 0.82, pylon: 0.72 },
    // the moving elements (active aero), found from the wing sections' heights
    flaps: {
      rearWing: ([x, y, z]) => Math.abs(z) < 0.42 && y > 0.895 && x < -1.95,
      frontWing: ([x, y, z]) => Math.abs(z) > 0.12 && Math.abs(z) < 0.84 && y > 0.3 && x > 2.36,
    },
    material(m) {
      if (/tread|sidewall|wheel_hub/.test(m)) return 'tyres'
      if (/^discs/.test(m)) return 'brakes'
      if (/mercedes_sw|sw_decals|sw_carbon|indicator_lights|rev_lights|generics_lcd|kers_|whitelight|clearled|cinture|chrome/.test(m)) return 'cockpit'
      if (/colordriver/.test(m)) return 'rollhoop'
      if (/mirror/.test(m)) return 'sidepods'
      return null
    },
  },
  w14: {
    src: '../model-sources/car-w14/model.glb',
    out: 'public/models/w14.glb',
    rotateY: Math.PI / 2,
    // scaled to the W17's 3.4 m wheelbase
    scale: null,
    // halo comes from its mesh; the region rule is effectively off
    halo: { y: 9, pylon: 9 },
    flaps: {
      rearWing: ([x, y, z]) => Math.abs(z) < 0.42 && y > 0.835 && x < -1.95,
      frontWing: ([x, y, z]) => Math.abs(z) > 0.25 && Math.abs(z) < 0.84 && y > 0.15 && x > 2.05,
    },
    material(m, node) {
      if (/(^|\/)(fl|fr|rear left|rear right)_\d+/i.test(node) || /pirelli/.test(m)) return 'tyres'
      if (/(^|\/)(steering|cube\.01[24]|cylinder\.00[234])_\d+/i.test(node)) return 'cockpit'
      // the halo is its own mesh in this model
      if (/(^|\/)cube\.005_11\//i.test(node)) return 'halo'
      return null
    },
  },
}

const cfg = CARS[car]
if (!cfg) throw new Error(`unknown car ${car}`)

/* ───────────── read & flatten ───────────── */

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.encoder': MeshoptEncoder })
await MeshoptEncoder.ready
const doc = await io.read(join(root, cfg.src))
const R = doc.getRoot()
const scene = R.getDefaultScene() ?? R.listScenes()[0]

// Gather every triangle in world space (source frame), with its material and node name.
const items = []
scene.traverse((node) => {
  const mesh = node.getMesh()
  if (!mesh) return
  const world = node.getWorldMatrix()
  const nrm = mat4.create()
  mat4.invert(nrm, world)
  mat4.transpose(nrm, nrm)
  // the node path, so rules can match a named parent (e.g. a wheel group)
  const names = []
  for (let cur = node; cur; cur = cur.getParentNode()) names.unshift(cur.getName())
  const path = names.join('/')
  for (const prim of mesh.listPrimitives()) items.push({ node, path, prim, world, nrm })
})

// Source → explorer frame: rotate about y, scale, then place the axles and the ground.
const G = mat4.create()
mat4.rotateY(G, G, cfg.rotateY)

function boundsOf(filter) {
  const min = [Infinity, Infinity, Infinity]
  const max = [-Infinity, -Infinity, -Infinity]
  const v = [0, 0, 0]
  for (const it of items) {
    if (!filter(it)) continue
    const pos = it.prim.getAttribute('POSITION')
    for (let i = 0; i < pos.getCount(); i++) {
      pos.getElement(i, v)
      vec3.transformMat4(v, v, it.world)
      vec3.transformMat4(v, v, G)
      for (let k = 0; k < 3; k++) {
        min[k] = Math.min(min[k], v[k])
        max[k] = Math.max(max[k], v[k])
      }
    }
  }
  return { min, max }
}

const lower = (s) => (s ?? '').toLowerCase()
const isTyre = (it) => cfg.material(lower(it.prim.getMaterial()?.getName()), it.path) === 'tyres'
const all = boundsOf(() => true)
const tyres = boundsOf(isTyre)
// axle positions from the tyres' fore/aft extent
const tyreLen = 0.72
const srcFront = tyres.max[0] - tyreLen / 2
const srcRear = tyres.min[0] + tyreLen / 2
const s = cfg.scale ?? (FRONT_AXLE - REAR_AXLE) / (srcFront - srcRear)
const T = mat4.create()
mat4.translate(T, T, [FRONT_AXLE, -all.min[1] * s, 0])
mat4.scale(T, T, [s, s, s])
mat4.translate(T, T, [-srcFront, 0, -(all.min[2] + all.max[2]) / 2])
mat4.multiply(G, T, G)
console.log(`${car}: scale ${s.toFixed(3)}, source wheelbase ${(srcFront - srcRear).toFixed(3)} m`)

/* ───────────── split ───────────── */

const buckets = new Map() // key → { part, material, attrs: {semantic: number[]}, sizes }
const stats = {}

for (const it of items) {
  const prim = it.prim
  const mat = prim.getMaterial()
  const mname = lower(mat?.getName())
  const byMat = cfg.material(mname, it.path)
  const sems = prim.listSemantics().filter((s) => /^(POSITION|NORMAL|TEXCOORD_[01]|COLOR_0)$/.test(s))
  const acc = Object.fromEntries(sems.map((s) => [s, prim.getAttribute(s)]))
  const idx = prim.getIndices()
  const n = idx ? idx.getCount() : acc.POSITION.getCount()
  const M = mat4.multiply(mat4.create(), G, it.world)
  const N = mat4.create()
  mat4.invert(N, M)
  mat4.transpose(N, N)
  const tmp = [0, 0, 0, 0]
  const tri = [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
  ]
  for (let t = 0; t < n; t += 3) {
    const ids = [0, 1, 2].map((k) => (idx ? idx.getScalar(t + k) : t + k))
    for (let k = 0; k < 3; k++) {
      acc.POSITION.getElement(ids[k], tri[k])
      vec3.transformMat4(tri[k], tri[k], M)
    }
    const c = [0, 1, 2].map((a) => (tri[0][a] + tri[1][a] + tri[2][a]) / 3)
    const part = byMat ?? regionRules(c, mname)
    const flap = cfg.flaps[part]?.(c) ? 'flap' : ''
    stats[part + (flap && ':flap')] = (stats[part + (flap && ':flap')] ?? 0) + 1
    const key = `${part}|${flap}|${mat ? R.listMaterials().indexOf(mat) : -1}|${sems.join(',')}`
    let b = buckets.get(key)
    if (!b) {
      b = { part, flap, material: mat, attrs: Object.fromEntries(sems.map((s) => [s, []])), acc }
      buckets.set(key, b)
    }
    for (let k = 0; k < 3; k++) {
      b.attrs.POSITION.push(...tri[k])
      for (const sem of sems) {
        if (sem === 'POSITION') continue
        acc[sem].getElement(ids[k], tmp)
        if (sem === 'NORMAL') {
          const v = vec3.transformMat3(
            [0, 0, 0],
            [tmp[0], tmp[1], tmp[2]],
            [N[0], N[1], N[2], N[4], N[5], N[6], N[8], N[9], N[10]],
          )
          vec3.normalize(v, v)
          b.attrs.NORMAL.push(...v)
        } else b.attrs[sem].push(...tmp.slice(0, acc[sem].getElementSize()))
      }
    }
  }
}
console.log('triangles per part:', stats)

/* ───────────── rebuild ───────────── */

const DEBUG_COLORS = {
  frontWing: [1, 0.2, 0.2], rearWing: [1, 0.6, 0], floor: [0.2, 0.4, 1], diffuser: [0.6, 0.2, 1],
  sidepods: [0.1, 0.9, 0.4], halo: [1, 1, 0], rollhoop: [1, 0.3, 0.8], nose: [0, 1, 1], suspension: [1, 1, 1],
  ice: [0.5, 0.5, 0.5], monocoque: [0.3, 0.3, 0.35], cockpit: [0.9, 0.5, 0.3], tyres: [0.08, 0.08, 0.08], brakes: [1, 0, 0],
}

const out = doc
const buf = R.listBuffers()[0] ?? out.createBuffer()
for (const n of [...R.listNodes()]) n.dispose()
for (const m of [...R.listMeshes()]) m.dispose()
const carRoot = out.createNode(`car:${car}`)
scene.addChild(carRoot)
const parts = new Map()
const debugMats = {}

// Flap pivots: the rear flap turns about its trailing edge (its leading edge lifts, opening the slot, as
// DRS did); the front flaps turn about their leading edge. Geometry is offset so the node origin is the pivot.
const pivots = {}
for (const b of buckets.values()) {
  if (!b.flap) continue
  const P = b.attrs.POSITION
  const pv = (pivots[b.part] ??= { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity })
  for (let i = 0; i < P.length; i += 3) {
    pv.minX = Math.min(pv.minX, P[i])
    pv.maxX = Math.max(pv.maxX, P[i])
    pv.minY = Math.min(pv.minY, P[i + 1])
    pv.maxY = Math.max(pv.maxY, P[i + 1])
  }
}
for (const [part, pv] of Object.entries(pivots)) {
  pv.at = part === 'rearWing' ? [pv.minX, pv.maxY, 0] : [pv.maxX, pv.minY, 0]
}
// Part and pivot nodes carry no mesh: compression rewrites the transforms of mesh nodes, so meshes live in
// leaf nodes and the pivots stay exact.
const meshNodes = new Map()
const leaf = (parent, name) => {
  let n = meshNodes.get(name)
  if (!n) {
    n = out.createNode(name).setMesh(out.createMesh(name))
    parent.addChild(n)
    meshNodes.set(name, n)
  }
  return n
}
for (const b of buckets.values()) {
  let group = parts.get(b.part)
  if (!group) {
    group = out.createNode(`part:${b.part}`).setExtras({ part: b.part })
    carRoot.addChild(group)
    parts.set(b.part, group)
  }
  let node
  if (b.flap) {
    const at = pivots[b.part].at
    const P = b.attrs.POSITION
    for (let i = 0; i < P.length; i += 3) {
      P[i] -= at[0]
      P[i + 1] -= at[1]
    }
    let pivot = parts.get(`flap:${b.part}`)
    if (!pivot) {
      pivot = out.createNode(`flap:${b.part}`).setTranslation(at).setExtras({ flap: b.part })
      group.addChild(pivot)
      parts.set(`flap:${b.part}`, pivot)
    }
    node = leaf(pivot, `mesh:${b.part}:flap`)
  } else node = leaf(group, `mesh:${b.part}`)
  const prim = out.createPrimitive()
  for (const [sem, arr] of Object.entries(b.attrs)) {
    const size = sem === 'POSITION' || sem === 'NORMAL' ? 3 : b.acc[sem].getElementSize()
    const type = { 2: 'VEC2', 3: 'VEC3', 4: 'VEC4' }[size]
    prim.setAttribute(sem, out.createAccessor().setType(type).setArray(new Float32Array(arr)).setBuffer(buf))
  }
  if (debug) {
    debugMats[b.part] ??= out.createMaterial(`debug:${b.part}`).setBaseColorFactor([...DEBUG_COLORS[b.part], 1]).setRoughnessFactor(0.6)
    prim.setMaterial(debugMats[b.part])
  } else if (b.material) prim.setMaterial(b.material)
  node.getMesh().addPrimitive(prim)
}

await out.transform(
  weld(),
  dedup(),
  prune(),
  textureCompress({ encoder: sharp, targetFormat: 'webp', resize: [1024, 1024], quality: 88 }),
  meshopt({ encoder: MeshoptEncoder, level: 'medium' }),
)
out.getRoot().getAsset().extras = {
  ...JSON.parse(readFileSync(join(root, cfg.src.replace('model.glb', 'source.json')), 'utf8')),
  changes:
    'Re-oriented and scaled to metres; triangles regrouped into selectable parts by material and position; textures re-encoded as WebP (max 1024 px); meshopt-compressed. Surface geometry unchanged.',
}
const dest = join(root, debug ? cfg.out.replace('.glb', '.debug.glb') : cfg.out)
mkdirSync(dirname(dest), { recursive: true })
await io.write(dest, out)
console.log(`wrote ${dest} (${(readFileSync(dest).length / 1e6).toFixed(2)} MB)`)
