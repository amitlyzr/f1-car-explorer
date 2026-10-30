// Prints the mesh/node structure of a GLB: node path, triangle count, material, world bounds.
import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import { getBounds } from '@gltf-transform/functions'
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS)
const doc = await io.read(process.argv[2])
const root = doc.getRoot()
const scene = root.getDefaultScene() ?? root.listScenes()[0]
const sb = getBounds(scene)
console.log('scene bounds', sb.min.map((v) => v.toFixed(2)), sb.max.map((v) => v.toFixed(2)))
console.log('materials', root.listMaterials().length, 'textures', root.listTextures().length, 'meshes', root.listMeshes().length, 'anims', root.listAnimations().length)
const max = +(process.argv[3] ?? 400)
let n = 0
scene.traverse((node) => {
  const mesh = node.getMesh()
  if (!mesh || n++ > max) return
  let tris = 0
  const mats = new Set()
  for (const p of mesh.listPrimitives()) {
    const idx = p.getIndices()
    tris += (idx ? idx.getCount() : p.getAttribute('POSITION').getCount()) / 3
    mats.add(p.getMaterial()?.getName() ?? '-')
  }
  const b = getBounds(node)
  const path = []
  let cur = node
  while (cur) { path.unshift(cur.getName()); cur = cur.getParentNode?.() ?? null }
  console.log(`${path.slice(-2).join(' / ').slice(0, 60).padEnd(60)} ${String(tris).padStart(7)}  ${[...mats].join(',').slice(0, 40).padEnd(40)} min ${b.min.map((v) => v.toFixed(2))} max ${b.max.map((v) => v.toFixed(2))}`)
})
