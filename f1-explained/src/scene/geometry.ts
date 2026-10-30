import * as THREE from 'three'

/** A cross-section of a lofted body: a superellipse in the YZ plane at position x. */
export interface Section {
  x: number
  /** half width */
  hw: number
  y0: number
  y1: number
  /** centre z */
  zc?: number
  /** superellipse exponent: 2 = ellipse, higher = boxier */
  p?: number
}

type Paint = (x: number, y: number, z: number) => THREE.Color

function catmull(p0: number, p1: number, p2: number, p3: number, t: number) {
  const t2 = t * t
  const t3 = t2 * t
  return 0.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3)
}

const KEYS = ['x', 'hw', 'y0', 'y1', 'zc', 'p'] as const

function sample(secs: Section[], steps: number): Required<Section>[] {
  const full = secs.map((s) => ({ zc: 0, p: 2, ...s }))
  const out: Required<Section>[] = []
  for (let i = 0; i < full.length - 1; i++) {
    const a = full[Math.max(0, i - 1)]
    const b = full[i]
    const c = full[i + 1]
    const d = full[Math.min(full.length - 1, i + 2)]
    for (let k = 0; k < steps; k++) {
      const t = k / steps
      const s = {} as Required<Section>
      for (const key of KEYS) s[key] = catmull(a[key], b[key], c[key], d[key], t)
      out.push(s)
    }
  }
  out.push(full[full.length - 1])
  return out
}

/** Build a smooth closed body by sweeping superellipse sections along x. */
export function loft(secs: Section[], paint?: Paint, radial = 48, steps = 10): THREE.BufferGeometry {
  const rings = sample(secs, steps)
  const pos: number[] = []
  const col: number[] = []
  const idx: number[] = []
  const white = new THREE.Color(1, 1, 1)
  const push = (x: number, y: number, z: number) => {
    pos.push(x, y, z)
    const c = paint ? paint(x, y, z) : white
    col.push(c.r, c.g, c.b)
  }
  for (const r of rings) {
    const cy = (r.y0 + r.y1) / 2
    const hy = (r.y1 - r.y0) / 2
    const e = 2 / r.p
    for (let j = 0; j <= radial; j++) {
      const th = (j / radial) * Math.PI * 2
      const c = Math.cos(th)
      const s = Math.sin(th)
      const z = r.zc + r.hw * Math.sign(c) * Math.abs(c) ** e
      const y = cy + hy * Math.sign(s) * Math.abs(s) ** e
      push(r.x, y, z)
    }
  }
  const row = radial + 1
  for (let i = 0; i < rings.length - 1; i++) {
    for (let j = 0; j < radial; j++) {
      const a = i * row + j
      const b = a + row
      // sections run front (+x) to back, so this winding faces outward
      idx.push(a, a + 1, b, b, a + 1, b + 1)
    }
  }
  // end caps
  for (const [ri, flip] of [
    [0, false],
    [rings.length - 1, true],
  ] as const) {
    const r = rings[ri]
    const centre = pos.length / 3
    push(r.x, (r.y0 + r.y1) / 2, r.zc)
    for (let j = 0; j < radial; j++) {
      const a = ri * row + j
      if (flip) idx.push(centre, a, a + 1)
      else idx.push(centre, a + 1, a)
    }
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3))
  g.setIndex(idx)
  g.computeVertexNormals()
  return g
}

/** Inverted (downforce) aerofoil extruded along z, leading edge at the origin, chord towards -x. */
export function wing(chord: number, span: number, thick = 0.12, camber = 0.06): THREE.BufferGeometry {
  const n = 24
  const upper: THREE.Vector2[] = []
  const lower: THREE.Vector2[] = []
  for (let i = 0; i <= n; i++) {
    const t = (1 - Math.cos((i / n) * Math.PI)) / 2
    const yt = 5 * thick * (0.2969 * Math.sqrt(t) - 0.126 * t - 0.3516 * t * t + 0.2843 * t ** 3 - 0.1036 * t ** 4)
    const yc = -camber * 4 * t * (1 - t)
    upper.push(new THREE.Vector2(-t * chord, (yc + yt) * chord))
    lower.push(new THREE.Vector2(-t * chord, (yc - yt) * chord))
  }
  const shape = new THREE.Shape([...upper, ...lower.reverse().slice(1)])
  const g = new THREE.ExtrudeGeometry(shape, { depth: span, bevelEnabled: false, curveSegments: 4 })
  g.translate(0, 0, -span / 2)
  g.computeVertexNormals()
  return g
}

/** Flat plate from a 2D outline in the XZ plane, `thick` tall, top at y = 0. */
export function plate(points: [number, number][], thick: number): THREE.BufferGeometry {
  const shape = new THREE.Shape(points.map(([x, z]) => new THREE.Vector2(x, z)))
  const g = new THREE.ExtrudeGeometry(shape, { depth: thick, bevelEnabled: false })
  // shape's y becomes world z; extrusion becomes world -y
  g.rotateX(Math.PI / 2)
  g.computeVertexNormals()
  return g
}

/** Side-profile plate (XY outline) extruded across z, centred on z = 0. */
export function profile(points: [number, number][], thick: number): THREE.BufferGeometry {
  const shape = new THREE.Shape(points.map(([x, y]) => new THREE.Vector2(x, y)))
  const g = new THREE.ExtrudeGeometry(shape, { depth: thick, bevelEnabled: false })
  g.translate(0, 0, -thick / 2)
  g.computeVertexNormals()
  return g
}

/** Rounded tyre carcass around the z axis. */
export function tyre(R: number, r: number, w: number): THREE.BufferGeometry {
  const h = w / 2
  const k = Math.min(0.05, w * 0.18)
  const pts: THREE.Vector2[] = [new THREE.Vector2(r, -h * 0.92)]
  pts.push(new THREE.Vector2(R - k, -h))
  for (let i = 1; i <= 6; i++) {
    const a = -Math.PI / 2 + (i / 6) * (Math.PI / 2)
    pts.push(new THREE.Vector2(R - k + Math.cos(a) * k, -h + k + Math.sin(a) * k))
  }
  for (let i = 0; i <= 6; i++) {
    const a = (i / 6) * (Math.PI / 2)
    pts.push(new THREE.Vector2(R - k + Math.cos(a) * k, h - k + Math.sin(a) * k))
  }
  pts.push(new THREE.Vector2(r, h * 0.92))
  const g = new THREE.LatheGeometry(pts, 64)
  g.rotateX(Math.PI / 2)
  g.computeVertexNormals()
  return g
}

/** Tube through points (used for the halo). */
export function tube(points: [number, number, number][], radius: number, closed = false): THREE.BufferGeometry {
  const curve = new THREE.CatmullRomCurve3(
    points.map((p) => new THREE.Vector3(...p)),
    closed,
    'centripetal',
  )
  return new THREE.TubeGeometry(curve, 96, radius, 14, closed)
}
