// Builds public/models/internals.glb: the sourced internal components, each scaled to real size, centred
// on its own origin and named `part:<id>`. The explorer places them inside whichever car is shown.
//
//   node scripts/build-internals.mjs
import { Document, NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS, EXTMeshGPUInstancing } from '@gltf-transform/extensions'
import { dedup, getBounds, meshopt, mergeDocuments, normals, prune, simplify, textureCompress, unpartition, weld } from '@gltf-transform/functions'
import { MeshoptEncoder, MeshoptSimplifier } from 'meshoptimizer'
import sharp from 'sharp'
import { mkdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({ 'meshopt.encoder': MeshoptEncoder })
await MeshoptEncoder.ready
await MeshoptSimplifier.ready

/**
 * slot: ../model-sources folder · part: explorer part id · size: real length of the longest side (m)
 * rot: Euler (rad) applied after centring · material: replace untextured source materials
 */
const COMPONENTS = [
  { slot: 'engine', part: 'ice', size: 0.68, rot: [0, Math.PI / 2, 0], material: 'alloy', simplify: 0.4 },
  { slot: 'turbo-alt', part: 'turbo', size: 0.3, rot: [0, 0, 0] },
  { slot: 'mguk', part: 'mguk', size: 0.26, rot: [0, 0, 0], simplify: 0.4 },
  { slot: 'ce', part: 'ce', size: 0.3, rot: [0, 0, 0] },
  { slot: 'gearbox', part: 'gearbox', size: 0.3, rot: [Math.PI / 2, 0, 0], material: 'steel', simplify: 0.25 },
  { slot: 'radiator', part: 'radiator', size: 0.5, rot: [0, Math.PI / 2, 0] },
  { slot: 'brakes', part: 'brakes', size: 0.34, rot: [0, Math.PI / 2, 0] },
]

const FINISH = {
  alloy: { color: [0.62, 0.64, 0.66, 1], metal: 1, rough: 0.38 },
  steel: { color: [0.55, 0.56, 0.58, 1], metal: 1, rough: 0.28 },
}

const out = new Document()
out.createBuffer()
const scene = out.createScene('internals')
out.getRoot().setDefaultScene(scene)
const top = out.createNode('internals')
scene.addChild(top)
const credits = []

for (const c of COMPONENTS) {
  const src = await io.read(join(root, '..', 'model-sources', c.slot, 'model.glb'))
  // dense CAD/scan meshes: fewer triangles, same silhouette (bounded error)
  if (c.simplify) await src.transform(weld(), simplify({ simplifier: MeshoptSimplifier, ratio: c.simplify, error: 0.0015 }))
  const srcScene = src.getRoot().getDefaultScene() ?? src.getRoot().listScenes()[0]
  const b = getBounds(srcScene)
  const dims = [0, 1, 2].map((k) => b.max[k] - b.min[k])
  const k = c.size / Math.max(...dims)
  const centre = [0, 1, 2].map((i) => (b.min[i] + b.max[i]) / 2)
  if (c.material) {
    for (const m of src.getRoot().listMaterials()) {
      const f = FINISH[c.material]
      m.setBaseColorFactor(f.color).setMetallicFactor(f.metal).setRoughnessFactor(f.rough)
    }
  }
  const map = mergeDocuments(out, src)
  const merged = map.get(srcScene)
  // part node (rotation) → scaling/centring node → the source's own nodes (animations intact)
  const part = out.createNode(`part:${c.part}`).setExtras({ part: c.part, source: c.slot })
  const q = eulerToQuat(c.rot)
  part.setRotation(q)
  const fit = out.createNode(`fit:${c.part}`).setScale([k, k, k]).setTranslation(centre.map((v) => -v * k))
  part.addChild(fit)
  for (const child of merged.listChildren()) fit.addChild(child)
  merged.dispose()
  top.addChild(part)
  credits.push(JSON.parse(readFileSync(join(root, '..', 'model-sources', c.slot, 'source.json'), 'utf8')))
  console.log(`+ ${c.part.padEnd(9)} from ${c.slot} ×${k.toPrecision(3)}`)
}

/* Energy Store: a tray of real Li-ion cells, one instanced mesh. */
{
  const src = await io.read(join(root, '../model-sources/battery-cell/model.glb'))
  // The cell's split normals and UV seams block simplification. Its printed label is unreadable at 18 mm
  // anyway, so keep the shape and the wrap's blue: drop normals/UVs, weld, simplify, recompute normals.
  for (const p of src.getRoot().listMeshes().flatMap((m) => m.listPrimitives())) {
    for (const sem of p.listSemantics()) if (sem !== 'POSITION') p.setAttribute(sem, null)
  }
  for (const m of src.getRoot().listMaterials()) {
    m.setBaseColorTexture(null).setNormalTexture(null).setMetallicRoughnessTexture(null).setOcclusionTexture(null)
    m.setBaseColorFactor([0.09, 0.27, 0.78, 1]).setMetallicFactor(0.2).setRoughnessFactor(0.35)
  }
  await src.transform(
    weld(),
    simplify({ simplifier: MeshoptSimplifier, ratio: 0.012, error: 0.03 }),
    normals({ overwrite: true }),
  )
  const cellMesh = src.getRoot().listMeshes()[0]
  for (const m of src.getRoot().listMeshes().slice(1)) m.dispose()
  const map = mergeDocuments(out, src)
  for (const s of src.getRoot().listScenes()) map.get(s)?.dispose()
  const mesh = map.get(cellMesh)
  // the cell's own extent
  let min = [Infinity, Infinity, Infinity]
  let max = [-Infinity, -Infinity, -Infinity]
  for (const p of mesh.listPrimitives()) {
    const pos = p.getAttribute('POSITION')
    min = min.map((v, i) => Math.min(v, pos.getMin([])[i]))
    max = max.map((v, i) => Math.max(v, pos.getMax([])[i]))
  }
  const ext = [0, 1, 2].map((i) => max[i] - min[i])
  const L = ext.indexOf(Math.max(...ext)) // the cell's long axis in its own coordinates
  const k = 0.065 / ext[L] // an 18650 cell is 65 mm long
  const dia = Math.min(...ext.filter((_, i) => i !== L)) * k
  const pitch = dia * 1.06
  const NX = 22
  const NZ = 20
  // instance positions in the cell's own (unscaled) coordinates, laid out across the two short axes
  const [A, B] = [0, 1, 2].filter((i) => i !== L)
  const T = []
  for (let i = 0; i < NX; i++)
    for (let j = 0; j < NZ; j++) {
      const v = [0, 0, 0]
      v[A] = ((i - (NX - 1) / 2) * pitch + (j % 2 ? pitch / 2 : 0)) / k
      v[B] = ((j - (NZ - 1) / 2) * pitch * 0.9) / k
      T.push(...v)
    }
  const instancing = out.createExtension(EXTMeshGPUInstancing).setRequired(true)
  const buf = out.getRoot().listBuffers()[0]
  const batch = instancing
    .createInstancedMesh()
    .setAttribute('TRANSLATION', out.createAccessor().setType('VEC3').setArray(new Float32Array(T)).setBuffer(buf))
  const centre = [0, 1, 2].map((i) => -((min[i] + max[i]) / 2))
  const cells = out.createNode('cells').setMesh(mesh).setTranslation(centre)
  cells.setExtension('EXT_mesh_gpu_instancing', batch)
  // stand the cells upright: bring the long axis to +y, then scale to metres
  const upright = L === 1 ? [0, 0, 0] : L === 0 ? [0, 0, Math.PI / 2] : [Math.PI / 2, 0, 0]
  const fit = out.createNode('fit:es').setScale([k, k, k]).setRotation(eulerToQuat(upright)).addChild(cells)
  const part = out.createNode('part:es').setExtras({ part: 'es', source: 'battery-cell' }).addChild(fit)
  top.addChild(part)
  credits.push(JSON.parse(readFileSync(join(root, '../model-sources/battery-cell/source.json'), 'utf8')))
  console.log(`+ es        from battery-cell: ${NX * NZ} cells, ${(NX * pitch).toFixed(2)} × ${(NZ * pitch * 0.9).toFixed(2)} m`)
}

await out.transform(
  unpartition(),
  dedup(),
  prune(),
  textureCompress({ encoder: sharp, targetFormat: 'webp', resize: [1024, 1024], quality: 85 }),
  meshopt({ encoder: MeshoptEncoder, level: 'medium' }),
)
out.getRoot().getAsset().extras = {
  sources: credits.map(({ slot, title, author, url, licence, licenceUrl }) => ({ slot, title, author, url, licence, licenceUrl })),
  changes: 'Scaled to real size, centred, re-oriented; untextured parts given metal finishes; Li-ion cell simplified and instanced into a module; textures re-encoded as WebP; meshopt-compressed.',
}
const dest = join(root, 'public/models/internals.glb')
mkdirSync(dirname(dest), { recursive: true })
await io.write(dest, out)
console.log(`wrote ${dest} (${(readFileSync(dest).length / 1e6).toFixed(2)} MB)`)

function eulerToQuat([x, y, z]) {
  const c1 = Math.cos(x / 2), s1 = Math.sin(x / 2)
  const c2 = Math.cos(y / 2), s2 = Math.sin(y / 2)
  const c3 = Math.cos(z / 2), s3 = Math.sin(z / 2)
  // XYZ order
  return [s1 * c2 * c3 + c1 * s2 * s3, c1 * s2 * c3 - s1 * c2 * s3, c1 * c2 * s3 + s1 * s2 * c3, c1 * c2 * c3 - s1 * s2 * s3]
}
