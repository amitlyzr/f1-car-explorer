import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import { loft, plate, profile, tube, tyre, wing, type Section } from './geometry'
import { M, Part, type MatKind } from './Part'
import { useExplorer } from '../state'

type V3 = [number, number, number]

/* ───────────────────────── livery ───────────────────────── */

const SILVER = new THREE.Color('#c4cad0')
const BLACK = new THREE.Color('#121416')
const TEAL = new THREE.Color('#00d2be')
const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

/** W17-inspired: silver upper body, black lower body and tail, joined by a soft PETRONAS-teal fade. */
function livery(x: number, y: number, z: number) {
  const line = 0.3 + 0.22 * smooth(1.6, -1.6, x) + 0.04 * Math.abs(z)
  const d = y - line
  const c = BLACK.clone().lerp(TEAL, smooth(-0.05, 0, d))
  c.lerp(SILVER, smooth(0.0, 0.07, d))
  // the rear of the engine cover fades to black
  return c.lerp(BLACK, smooth(-0.9, -1.9, x) * smooth(-0.02, 0.05, d))
}

/* ───────────────────────── helpers ───────────────────────── */

const UP = new THREE.Vector3(0, 1, 0)

function Strut({ a, b, r = 0.012, kind = 'carbon' as MatKind }: { a: V3; b: V3; r?: number; kind?: MatKind }) {
  const { pos, quat, len } = useMemo(() => {
    const va = new THREE.Vector3(...a)
    const vb = new THREE.Vector3(...b)
    const dir = vb.clone().sub(va)
    return {
      pos: va.clone().add(vb).multiplyScalar(0.5),
      quat: new THREE.Quaternion().setFromUnitVectors(UP, dir.clone().normalize()),
      len: dir.length(),
    }
  }, [a, b])
  return (
    <mesh position={pos} quaternion={quat}>
      <cylinderGeometry args={[r, r, len, 10]} />
      <M kind={kind} />
    </mesh>
  )
}

function Box({ p, s, kind, rot }: { p: V3; s: V3; kind: MatKind; rot?: V3 }) {
  return (
    <mesh position={p} rotation={rot}>
      <boxGeometry args={s} />
      <M kind={kind} />
    </mesh>
  )
}

/** Animated angle for active-aero flaps. */
function useFlap(corner: number, straight: number) {
  const { aero } = useExplorer()
  const ref = useRef<THREE.Group>(null)
  useFrame((_, dt) => {
    if (!ref.current) return
    const target = THREE.MathUtils.degToRad(aero === 'straight' ? straight : corner)
    ref.current.rotation.z += (target - ref.current.rotation.z) * Math.min(1, dt * 6)
  })
  return ref
}

/* ───────────────────────── geometry (built once) ───────────────────────── */

const NOSE: Section[] = [
  { x: 3.08, hw: 0.07, y0: 0.15, y1: 0.25, p: 2.4 },
  { x: 2.7, hw: 0.11, y0: 0.14, y1: 0.33, p: 2.6 },
  { x: 2.2, hw: 0.16, y0: 0.14, y1: 0.43, p: 2.8 },
  { x: 1.6, hw: 0.22, y0: 0.13, y1: 0.53, p: 3 },
]
const TUB: Section[] = [
  NOSE[3],
  { x: 1.0, hw: 0.29, y0: 0.09, y1: 0.62, p: 3.2 },
  { x: 0.5, hw: 0.36, y0: 0.07, y1: 0.66, p: 3.4 },
  { x: 0.0, hw: 0.38, y0: 0.07, y1: 0.64, p: 3.4 },
  { x: -0.2, hw: 0.38, y0: 0.07, y1: 0.68, p: 3.4 },
]
const COVER: Section[] = [
  TUB[4],
  { x: -0.5, hw: 0.35, y0: 0.07, y1: 0.8, p: 3 },
  { x: -0.9, hw: 0.29, y0: 0.09, y1: 0.8, p: 2.6 },
  { x: -1.35, hw: 0.21, y0: 0.11, y1: 0.66, p: 2.4 },
  { x: -1.85, hw: 0.13, y0: 0.15, y1: 0.5, p: 2.2 },
  { x: -2.2, hw: 0.07, y0: 0.22, y1: 0.4, p: 2 },
]
const HOOP: Section[] = [
  { x: -0.1, hw: 0.12, y0: 0.66, y1: 0.99, p: 2.6 },
  { x: -0.3, hw: 0.14, y0: 0.62, y1: 1.02, p: 2.6 },
  { x: -0.65, hw: 0.11, y0: 0.6, y1: 0.9, p: 2.4 },
  { x: -1.05, hw: 0.05, y0: 0.6, y1: 0.7, p: 2.2 },
]
const pod = (s: number): Section[] => [
  { x: 0.72, hw: 0.15, y0: 0.24, y1: 0.5, zc: 0.53 * s, p: 4 },
  { x: 0.45, hw: 0.2, y0: 0.15, y1: 0.53, zc: 0.54 * s, p: 4 },
  { x: -0.2, hw: 0.19, y0: 0.1, y1: 0.5, zc: 0.5 * s, p: 3.4 },
  { x: -0.8, hw: 0.13, y0: 0.09, y1: 0.4, zc: 0.4 * s, p: 3 },
  { x: -1.45, hw: 0.05, y0: 0.1, y1: 0.26, zc: 0.24 * s, p: 2.5 },
]
const GEARBOX: Section[] = [
  { x: -1.3, hw: 0.13, y0: 0.12, y1: 0.4, p: 6 },
  { x: -2.0, hw: 0.08, y0: 0.15, y1: 0.35, p: 6 },
  { x: -2.38, hw: 0.05, y0: 0.22, y1: 0.33, p: 3 },
]

const HALO_LOOP: V3[] = [
  [-0.2, 0.64, 0.31],
  [-0.06, 0.83, 0.33],
  [0.3, 0.87, 0.27],
  [0.55, 0.87, 0],
  [0.3, 0.87, -0.27],
  [-0.06, 0.83, -0.33],
  [-0.2, 0.64, -0.31],
]

function useGeometries() {
  return useMemo(
    () => ({
      nose: loft(NOSE, livery),
      tub: loft(TUB, livery),
      cover: loft(COVER, livery),
      hoop: loft(HOOP, livery, 40, 8),
      podL: loft(pod(1), livery),
      podR: loft(pod(-1), livery),
      gearbox: loft(GEARBOX, undefined, 24, 6),
      floor: plate(
        [
          [1.15, -0.42],
          [0.7, -0.8],
          [-1.25, -0.8],
          [-1.4, -0.58],
          [-1.9, -0.55],
          [-1.9, 0.55],
          [-1.4, 0.58],
          [-1.25, 0.8],
          [0.7, 0.8],
          [1.15, 0.42],
        ],
        0.025,
      ),
      fin: profile(
        [
          [-0.75, 0.79],
          [-1.95, 0.48],
          [-1.95, 0.84],
          [-1.7, 0.86],
        ],
        0.008,
      ),
      rwEndplate: profile(
        [
          [-1.94, 0.4],
          [-2.44, 0.4],
          [-2.46, 1.02],
          [-2.06, 1.04],
          [-1.98, 0.95],
        ],
        0.018,
      ),
      fwEndplate: profile(
        [
          [3.16, 0.03],
          [2.56, 0.03],
          [2.58, 0.28],
          [2.98, 0.33],
        ],
        0.016,
      ),
      fwMain: wing(0.32, 1.8, 0.1, 0.05),
      fwFlap1: wing(0.17, 1.76, 0.1, 0.06),
      fwFlap2: wing(0.13, 1.7, 0.1, 0.07),
      rwMain: wing(0.3, 0.98, 0.12, 0.06),
      rwFlap: wing(0.2, 0.98, 0.1, 0.07),
      halo: tube(HALO_LOOP, 0.028),
      haloPylon: tube(
        [
          [0.55, 0.87, 0],
          [0.68, 0.78, 0],
          [0.82, 0.64, 0],
        ],
        0.03,
      ),
      tyreF: tyre(0.36, 0.23, 0.28),
      tyreR: tyre(0.36, 0.23, 0.37),
    }),
    [],
  )
}

/* ───────────────────────── sub-assemblies ───────────────────────── */

function Wheel({ x, z, s, w, geo }: { x: number; z: number; s: number; w: number; geo: THREE.BufferGeometry }) {
  const outer = (w / 2) * s
  return (
    <group position={[x, 0.36, z]}>
      <Part id="tyres" ghost={0.28}>
        <mesh geometry={geo}>
          <M kind="rubber" side={THREE.DoubleSide} />
        </mesh>
        {/* compound stripe on the outer sidewall: Medium = yellow */}
        <mesh position={[0, 0, outer * 1.002]}>
          <torusGeometry args={[0.305, 0.006, 6, 64]} />
          <M kind="medium" />
        </mesh>
        <mesh position={[0, 0, outer * 0.86]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.232, 0.232, w * 0.12, 48, 1, true]} />
          <M kind="rim" side={THREE.DoubleSide} />
        </mesh>
        {Array.from({ length: 10 }, (_, i) => (
          <mesh key={i} position={[0, 0, outer * 0.84]} rotation={[0, 0, (i / 10) * Math.PI * 2]}>
            <boxGeometry args={[0.2, 0.02, 0.012]} />
            <M kind="rim" />
          </mesh>
        ))}
        <mesh position={[0, 0, outer * 0.86]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.045, 0.045, 0.05, 6]} />
          <M kind="teal" />
        </mesh>
      </Part>
      <Part id="brakes">
        <mesh position={[0, 0, -s * w * 0.1]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.165, 0.165, 0.032, 40]} />
          <M kind="disc" />
        </mesh>
        <mesh position={[0, 0, -s * w * 0.1]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.15, 0.008, 6, 48]} />
          <M kind="hot" />
        </mesh>
        <mesh position={[-0.04, 0.15, -s * w * 0.1]} rotation={[0, 0, 0.3]}>
          <boxGeometry args={[0.16, 0.06, 0.07]} />
          <M kind="teal" />
        </mesh>
      </Part>
    </group>
  )
}

function Suspension() {
  const arms: { a: V3; b: V3; kind?: MatKind; r?: number }[] = []
  for (const s of [1, -1]) {
    // front
    arms.push({ a: [2.18, 0.47, 0.16 * s], b: [1.9, 0.5, 0.64 * s] })
    arms.push({ a: [1.58, 0.5, 0.22 * s], b: [1.9, 0.5, 0.64 * s] })
    arms.push({ a: [2.24, 0.2, 0.13 * s], b: [1.9, 0.2, 0.66 * s] })
    arms.push({ a: [1.5, 0.17, 0.22 * s], b: [1.9, 0.2, 0.66 * s] })
    arms.push({ a: [1.92, 0.21, 0.62 * s], b: [1.8, 0.55, 0.18 * s], r: 0.01 })
    arms.push({ a: [2.02, 0.31, 0.17 * s], b: [2.0, 0.33, 0.64 * s], r: 0.008 })
    // rear
    arms.push({ a: [-1.22, 0.5, 0.17 * s], b: [-1.5, 0.52, 0.58 * s] })
    arms.push({ a: [-1.85, 0.5, 0.11 * s], b: [-1.5, 0.52, 0.58 * s] })
    arms.push({ a: [-1.18, 0.17, 0.17 * s], b: [-1.5, 0.18, 0.58 * s] })
    arms.push({ a: [-1.82, 0.18, 0.11 * s], b: [-1.5, 0.18, 0.58 * s] })
    arms.push({ a: [-1.5, 0.5, 0.56 * s], b: [-1.4, 0.2, 0.15 * s], r: 0.01 })
    arms.push({ a: [-1.5, 0.36, 0.14 * s], b: [-1.5, 0.36, 0.58 * s], r: 0.022, kind: 'alu' })
  }
  return (
    <Part id="suspension">
      {arms.map((a, i) => (
        <Strut key={i} a={a.a} b={a.b} r={a.r} kind={a.kind} />
      ))}
      {/* uprights */}
      {[1, -1].map((s) => (
        <group key={s}>
          <Box p={[1.9, 0.35, 0.64 * s]} s={[0.08, 0.34, 0.05]} kind="titanium" />
          <Box p={[-1.5, 0.35, 0.58 * s]} s={[0.1, 0.38, 0.05]} kind="titanium" />
        </group>
      ))}
    </Part>
  )
}

function FrontWing({ g }: { g: ReturnType<typeof useGeometries> }) {
  const f1 = useFlap(-16, -4)
  const f2 = useFlap(-28, -8)
  return (
    <Part id="frontWing">
      <group position={[3.16, 0.07, 0]} rotation={[0, 0, THREE.MathUtils.degToRad(-4)]}>
        <mesh geometry={g.fwMain}>
          <M kind="carbon" />
        </mesh>
      </group>
      <group ref={f1} position={[2.86, 0.105, 0]}>
        <mesh geometry={g.fwFlap1}>
          <M kind="carbon" />
        </mesh>
      </group>
      <group ref={f2} position={[2.72, 0.155, 0]}>
        <mesh geometry={g.fwFlap2}>
          <M kind="silver" />
        </mesh>
      </group>
      {[1, -1].map((s) => (
        <mesh key={s} geometry={g.fwEndplate} position={[0, 0, 0.9 * s]}>
          <M kind="carbon" />
        </mesh>
      ))}
      {/* nose pylons */}
      {[1, -1].map((s) => (
        <Box key={s} p={[2.95, 0.12, 0.05 * s]} s={[0.22, 0.08, 0.012]} kind="carbon" />
      ))}
    </Part>
  )
}

function RearWing({ g }: { g: ReturnType<typeof useGeometries> }) {
  // pivot at the flap's trailing edge: flattening it opens the slot (like DRS did)
  const flap = useFlap(-36, -6)
  return (
    <Part id="rearWing">
      {[1, -1].map((s) => (
        <mesh key={s} geometry={g.rwEndplate} position={[0, 0, 0.5 * s]}>
          <M kind="carbon" />
        </mesh>
      ))}
      <group position={[-1.98, 0.8, 0]} rotation={[0, 0, THREE.MathUtils.degToRad(-8)]}>
        <mesh geometry={g.rwMain}>
          <M kind="carbon" />
        </mesh>
      </group>
      <group ref={flap} position={[-2.42, 0.98, 0]}>
        <group position={[0.2, 0, 0]}>
          <mesh geometry={g.rwFlap}>
            <M kind="silver" />
          </mesh>
        </group>
      </group>
      {/* swan-neck pylon */}
      <Box p={[-2.06, 0.6, 0]} s={[0.07, 0.4, 0.025]} kind="carbon" rot={[0, 0, 0.18]} />
      {/* endplate tops in team accent */}
      {[1, -1].map((s) => (
        <Box key={s} p={[-2.22, 1.0, 0.5 * s]} s={[0.36, 0.035, 0.022]} kind="teal" />
      ))}
      {/* rain light */}
      <Box p={[-2.4, 0.37, 0]} s={[0.03, 0.05, 0.14]} kind="redlight" />
    </Part>
  )
}

/* ───────────────────────── the car ───────────────────────── */

export function Car() {
  const g = useGeometries()
  return (
    <group>
      {/* ── chassis & bodywork ── */}
      <Part id="nose" ghost={0.1}>
        <mesh geometry={g.nose}>
          <M kind="livery" />
        </mesh>
      </Part>

      <Part id="monocoque" ghost={0.1}>
        <mesh geometry={g.tub}>
          <M kind="livery" />
        </mesh>
        {/* cockpit opening */}
        <mesh position={[0.22, 0.655, 0]} scale={[0.5, 0.03, 0.27]}>
          <sphereGeometry args={[1, 32, 12]} />
          <M kind="matte" />
        </mesh>
      </Part>

      <Part id="cockpit">
        <mesh position={[0.08, 0.72, 0]}>
          <sphereGeometry args={[0.12, 32, 24]} />
          <M kind="helmet" />
        </mesh>
        <mesh position={[0.08, 0.72, 0]}>
          <sphereGeometry args={[0.123, 32, 12, Math.PI - 0.95, 1.9, 1.15, 0.42]} />
          <M kind="visor" />
        </mesh>
        <mesh position={[0.08, 0.76, 0]} rotation={[0, 0, 0]}>
          <torusGeometry args={[0.121, 0.008, 8, 48, Math.PI]} />
          <M kind="teal" />
        </mesh>
        <Box p={[0.5, 0.64, 0]} s={[0.03, 0.12, 0.26]} kind="carbon" rot={[0, 0, -0.35]} />
        <Box p={[0.488, 0.645, 0]} s={[0.01, 0.06, 0.1]} kind="screen" rot={[0, 0, -0.35]} />
      </Part>

      <Part id="halo">
        <mesh geometry={g.halo}>
          <M kind="carbon" />
        </mesh>
        <mesh geometry={g.haloPylon}>
          <M kind="carbon" />
        </mesh>
      </Part>

      <Part id="rollhoop" ghost={0.12}>
        <mesh geometry={g.hoop}>
          <M kind="livery" />
        </mesh>
        <mesh position={[-0.095, 0.86, 0]} scale={[0.02, 0.1, 0.08]}>
          <sphereGeometry args={[1, 24, 16]} />
          <M kind="matte" />
        </mesh>
        <Box p={[-0.3, 1.035, 0]} s={[0.12, 0.03, 0.06]} kind="matte" />
      </Part>

      {/* engine cover: clicking it opens the power unit underneath */}
      <Part id="ice" ghost={0.1}>
        <mesh geometry={g.cover}>
          <M kind="livery" />
        </mesh>
        <mesh geometry={g.fin}>
          <M kind="carbon" />
        </mesh>
      </Part>

      <Part id="sidepods" ghost={0.12}>
        <mesh geometry={g.podL}>
          <M kind="livery" />
        </mesh>
        <mesh geometry={g.podR}>
          <M kind="livery" />
        </mesh>
        {[1, -1].map((s) => (
          <group key={s}>
            {/* inlet */}
            <mesh position={[0.725, 0.4, 0.54 * s]} scale={[0.01, 0.075, 0.13]}>
              <sphereGeometry args={[1, 24, 12]} />
              <M kind="matte" />
            </mesh>
            {/* mirror */}
            <Strut a={[0.62, 0.52, 0.45 * s]} b={[0.6, 0.66, 0.55 * s]} r={0.008} />
            <Box p={[0.6, 0.67, 0.58 * s]} s={[0.05, 0.05, 0.12]} kind="carbon" />
            {/* radiator (visible in X-ray) */}
            <Box p={[0.1, 0.3, 0.52 * s]} s={[0.55, 0.28, 0.035]} kind="alu" rot={[0.35 * s, 0, 0]} />
          </group>
        ))}
      </Part>

      <Part id="floor">
        <mesh geometry={g.floor} position={[0, 0.06, 0]}>
          <M kind="carbon" />
        </mesh>
        {/* edge wings and bargeboards */}
        {[1, -1].map((s) => (
          <group key={s}>
            <Box p={[-0.3, 0.075, 0.81 * s]} s={[1.85, 0.03, 0.02]} kind="teal" />
            <Box p={[0.95, 0.12, 0.55 * s]} s={[0.35, 0.12, 0.012]} kind="carbon" rot={[0, 0.25 * s, 0]} />
            <Box p={[0.85, 0.1, 0.33 * s]} s={[0.4, 0.08, 0.01]} kind="carbon" />
          </group>
        ))}
        {/* plank */}
        <Box p={[-0.3, 0.025, 0]} s={[2.6, 0.012, 0.3]} kind="fuel" />
      </Part>

      <Part id="diffuser">
        <Box p={[-2.12, 0.16, 0]} s={[0.58, 0.012, 1.04]} kind="carbon" rot={[0, 0, -0.42]} />
        {[-0.5, -0.25, 0, 0.25, 0.5].map((z) => (
          <mesh key={z} position={[-2.12, 0.125, z]} rotation={[0, 0, -0.42]}>
            <boxGeometry args={[0.56, 0.06, 0.01]} />
            <M kind="carbon" />
          </mesh>
        ))}
      </Part>

      <FrontWing g={g} />
      <RearWing g={g} />
      <Suspension />

      {/* ── wheels ── */}
      <Wheel x={1.9} z={0.8} s={1} w={0.28} geo={g.tyreF} />
      <Wheel x={1.9} z={-0.8} s={-1} w={0.28} geo={g.tyreF} />
      <Wheel x={-1.5} z={0.77} s={1} w={0.37} geo={g.tyreR} />
      <Wheel x={-1.5} z={-0.77} s={-1} w={0.37} geo={g.tyreR} />

      {/* ── power unit (inside) ── */}
      <Part id="fuel">
        <RoundedBox args={[0.42, 0.36, 0.56]} radius={0.06} position={[-0.38, 0.4, 0]}>
          <M kind="fuel" />
        </RoundedBox>
      </Part>

      <Part id="es">
        <RoundedBox args={[0.5, 0.08, 0.5]} radius={0.02} position={[-0.36, 0.135, 0]}>
          <M kind="battery" />
        </RoundedBox>
        {[-0.16, 0, 0.16].map((z) => (
          <Box key={z} p={[-0.36, 0.18, z]} s={[0.44, 0.012, 0.1]} kind="carbon" />
        ))}
      </Part>

      <Part id="ice">
        <Box p={[-0.98, 0.22, 0]} s={[0.66, 0.2, 0.34]} kind="alu" />
        {[1, -1].map((s) => (
          <group key={s} position={[-0.98, 0.37, 0.11 * s]} rotation={[(Math.PI / 4) * s, 0, 0]}>
            <Box p={[0, 0.06, 0]} s={[0.62, 0.2, 0.13]} kind="alu" />
            <Box p={[0, 0.17, 0]} s={[0.6, 0.03, 0.11]} kind="carbon" />
          </group>
        ))}
        <Box p={[-0.98, 0.42, 0]} s={[0.5, 0.07, 0.1]} kind="teal" />
      </Part>

      <Part id="mguk">
        <mesh position={[-0.72, 0.16, 0.24]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.068, 0.068, 0.22, 28]} />
          <M kind="copper" />
        </mesh>
        <mesh position={[-0.6, 0.16, 0.24]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.072, 0.072, 0.03, 28]} />
          <M kind="carbon" />
        </mesh>
      </Part>

      <Part id="turbo">
        <mesh position={[-1.4, 0.42, 0]} rotation={[0, Math.PI / 2, 0]}>
          <torusGeometry args={[0.07, 0.04, 14, 32]} />
          <M kind="titanium" />
        </mesh>
        <mesh position={[-1.33, 0.42, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.05, 0.08, 0.1, 24]} />
          <M kind="alu" />
        </mesh>
        <Strut a={[-1.46, 0.42, 0]} b={[-2.36, 0.44, 0]} r={0.038} kind="titanium" />
        <mesh position={[-2.37, 0.44, 0]} rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[0.038, 0.006, 8, 24]} />
          <M kind="hot" />
        </mesh>
      </Part>

      <Part id="ce">
        <Box p={[0.18, 0.2, -0.5]} s={[0.28, 0.09, 0.18]} kind="carbon" />
        <Box p={[0.18, 0.25, -0.5]} s={[0.24, 0.012, 0.14]} kind="screen" />
      </Part>

      <Part id="gearbox">
        <mesh geometry={g.gearbox}>
          <M kind="titanium" />
        </mesh>
      </Part>
    </group>
  )
}
