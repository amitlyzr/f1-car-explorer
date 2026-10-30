import { useEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { ContactShadows, RoundedBox, useAnimations, useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { M, Part, useSkin } from './Part'
import { useExplorer, type CarModel } from '../state'

type V3 = [number, number, number]

const CAR_URL: Record<CarModel, string> = { w17: '/models/w17.glb', w14: '/models/w14.glb' }
const INTERNALS_URL = '/models/internals.glb'

/** Bodywork fades to this opacity in X-ray so the power unit shows through. */
const GHOST: Record<string, number> = {
  nose: 0.1,
  monocoque: 0.1,
  ice: 0.1,
  sidepods: 0.12,
  rollhoop: 0.12,
  tyres: 0.28,
}

/** Straight Mode flap rotation (degrees) about each flap's pivot, as built by scripts/build-car.mjs. */
const FLAP_OPEN: Record<string, number> = { rearWing: 26, frontWing: 18 }

/**
 * Where the sourced internals sit in the car (explorer frame: metres, +x forward, axles at 1.9 / -1.5).
 * `as` files a component under another part, e.g. the radiators belong to the sidepods.
 */
type Placement = { pos: V3; rot?: V3; as?: string }
const LAYOUT: Record<CarModel, Record<string, Placement[]>> = {
  w17: {
    ice: [{ pos: [-0.98, 0.33, 0] }],
    turbo: [{ pos: [-1.42, 0.5, 0], rot: [0, Math.PI / 2, 0] }],
    mguk: [{ pos: [-0.66, 0.19, 0.25], rot: [0, Math.PI / 2, 0] }],
    es: [{ pos: [-0.36, 0.11, 0] }],
    ce: [{ pos: [0.18, 0.24, -0.5], rot: [0, Math.PI / 2, 0] }],
    gearbox: [{ pos: [-1.72, 0.3, 0] }],
    radiator: [
      { pos: [0.1, 0.34, 0.5], rot: [0, -0.3, 0], as: 'sidepods' },
      { pos: [0.1, 0.34, -0.5], rot: [0, 0.3, 0], as: 'sidepods' },
    ],
    brakes: [
      { pos: [1.9, 0.35, 0.71] },
      { pos: [1.9, 0.35, -0.71], rot: [0, Math.PI, 0] },
      { pos: [-1.5, 0.35, 0.64] },
      { pos: [-1.5, 0.35, -0.64], rot: [0, Math.PI, 0] },
    ],
  },
  w14: {
    ice: [{ pos: [-0.98, 0.33, 0] }],
    turbo: [{ pos: [-1.42, 0.5, 0], rot: [0, Math.PI / 2, 0] }],
    mguk: [{ pos: [-0.66, 0.19, 0.25], rot: [0, Math.PI / 2, 0] }],
    es: [{ pos: [-0.36, 0.11, 0] }],
    ce: [{ pos: [0.18, 0.24, -0.5], rot: [0, Math.PI / 2, 0] }],
    gearbox: [{ pos: [-1.72, 0.3, 0] }],
    radiator: [
      { pos: [0.1, 0.34, 0.5], rot: [0, -0.3, 0], as: 'sidepods' },
      { pos: [0.1, 0.34, -0.5], rot: [0, 0.3, 0], as: 'sidepods' },
    ],
    brakes: [
      { pos: [1.9, 0.35, 0.7] },
      { pos: [1.9, 0.35, -0.7], rot: [0, Math.PI, 0] },
      { pos: [-1.5, 0.35, 0.64] },
      { pos: [-1.5, 0.35, -0.64], rot: [0, Math.PI, 0] },
    ],
  },
}

/**
 * Part groups (nodes with `extras.part`) of a loaded scene, collected once and kept on the scene itself:
 * mounting re-parents them, so a second traversal would find nothing.
 */
function partGroups(scene: THREE.Object3D): THREE.Object3D[] {
  if (!scene.userData.partGroups) {
    const list: THREE.Object3D[] = []
    scene.traverse((o) => {
      if (o.userData.part) list.push(o)
    })
    scene.userData.partGroups = list
  }
  return scene.userData.partGroups
}

function Skin({ object }: { object: THREE.Object3D }) {
  useSkin(object)
  return <primitive object={object} />
}

function Flaps({ groups }: { groups: THREE.Object3D[] }) {
  const { aero } = useExplorer()
  const flaps = useMemo(() => {
    const list: THREE.Object3D[] = []
    for (const g of groups) g.traverse((o) => o.userData.flap && list.push(o))
    return list
  }, [groups])
  useFrame((_, dt) => {
    for (const f of flaps) {
      const target = aero === 'straight' ? THREE.MathUtils.degToRad(FLAP_OPEN[f.userData.flap] ?? 0) : 0
      f.rotation.z += (target - f.rotation.z) * Math.min(1, dt * 6)
    }
  })
  return null
}

function Body({ car }: { car: CarModel }) {
  const { scene } = useGLTF(CAR_URL[car], false, true)
  const groups = partGroups(scene)
  return (
    <>
      {groups.map((g) => (
        <Part key={g.uuid} id={g.userData.part} ghost={GHOST[g.userData.part] ?? null}>
          <Skin object={g} />
        </Part>
      ))}
      <Flaps groups={groups} />
    </>
  )
}

function Internals({ car }: { car: CarModel }) {
  const { xray } = useExplorer()
  const { scene, animations } = useGLTF(INTERNALS_URL, false, true)
  const sources = useMemo(() => Object.fromEntries(partGroups(scene).map((o) => [o.userData.part as string, o])), [scene])
  // one object per placement: the first uses the loaded node itself (keeps animation bindings), the rest clone it
  const placed = useMemo(
    () =>
      Object.entries(LAYOUT[car])
        .filter(([id]) => sources[id])
        .flatMap(([id, list]) =>
          list.map((p, i) => ({ id: p.as ?? id, key: `${id}-${i}`, object: i === 0 ? sources[id] : sources[id].clone(true), ...p })),
        ),
    [car, sources],
  )
  // the gear set's own animation from its source model
  const gearbox = sources.gearbox
  const { actions } = useAnimations(animations, gearbox)
  useEffect(() => {
    for (const a of Object.values(actions)) a?.reset().play()
  }, [actions])

  return (
    <>
      {placed.map((p) => (
        // under the bodywork, so only shown in X-ray (each car's body differs; nothing should poke through);
        // brakes stay, they are seen through the wheels
        <group key={p.key} position={p.pos} rotation={p.rot ?? [0, 0, 0]} visible={xray || p.id === 'brakes'}>
          <Part id={p.id}>
            <Skin object={p.object} />
          </Part>
        </group>
      ))}
    </>
  )
}

/** No openly licensed model of an F1 fuel bladder exists, so the fuel cell stays a modelled shape. */
function FuelCell() {
  const { xray } = useExplorer()
  return (
    <Part id="fuel">
      <RoundedBox args={[0.42, 0.36, 0.56]} radius={0.06} position={[-0.38, 0.42, 0]} visible={xray}>
        <M kind="fuel" />
      </RoundedBox>
    </Part>
  )
}

export function ModelCar() {
  const { car } = useExplorer()
  return (
    <group>
      <Body car={car} />
      <Internals car={car} />
      <FuelCell />
      <ContactShadows key={car} position={[0, 0.001, 0]} scale={9} blur={2.4} far={1.2} opacity={0.75} resolution={1024} frames={1} />
    </group>
  )
}

useGLTF.preload(CAR_URL.w17, false, true)
useGLTF.preload(INTERNALS_URL, false, true)
