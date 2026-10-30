import { createContext, useContext, useEffect, useMemo, useRef, type ReactNode } from 'react'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import { useExplorer } from '../state'

const ACCENT = new THREE.Color('#00d2be')

interface PartState {
  id: string
  selected: boolean
  hovered: boolean
  /** opacity this part fades to in X-ray, if it is bodywork */
  ghost: number | null
}

const PartCtx = createContext<PartState>({ id: '', selected: false, hovered: false, ghost: null })

/** A clickable car component. Children meshes use <M> so they light up when hovered/selected. */
export function Part({ id, ghost = null, children }: { id: string; ghost?: number | null; children: ReactNode }) {
  const { selected, hovered, xray, select, hover } = useExplorer()
  // In X-ray, bodywork lets pointer events through to the parts underneath.
  const passThrough = xray && ghost !== null

  const onOver = (e: ThreeEvent<PointerEvent>) => {
    if (passThrough) return
    e.stopPropagation()
    hover(id)
    document.body.style.cursor = 'pointer'
  }
  const onOut = () => {
    if (hovered === id) hover(null)
    document.body.style.cursor = ''
  }
  const onClick = (e: ThreeEvent<MouseEvent>) => {
    if (passThrough || e.delta > 6) return
    e.stopPropagation()
    select(id)
  }

  return (
    <PartCtx.Provider value={{ id, selected: selected === id, hovered: hovered === id, ghost: xray ? ghost : null }}>
      <group onPointerOver={onOver} onPointerOut={onOut} onClick={onClick}>
        {children}
      </group>
    </PartCtx.Provider>
  )
}

type Spec = {
  color: string
  roughness: number
  metalness: number
  clearcoat?: number
  glow?: number
  opacity?: number
  vertexColors?: boolean
}

const SPECS = {
  livery: { color: '#ffffff', roughness: 0.28, metalness: 0.75, clearcoat: 1, vertexColors: true },
  silver: { color: '#b9c0c7', roughness: 0.25, metalness: 0.85, clearcoat: 1 },
  carbon: { color: '#16181b', roughness: 0.4, metalness: 0.3, clearcoat: 0.6 },
  matte: { color: '#0d0e10', roughness: 0.8, metalness: 0.1 },
  teal: { color: '#00c2b0', roughness: 0.3, metalness: 0.3, clearcoat: 1, glow: 0.15 },
  alu: { color: '#a3abb3', roughness: 0.32, metalness: 1 },
  titanium: { color: '#6b737b', roughness: 0.38, metalness: 1 },
  copper: { color: '#c07a42', roughness: 0.35, metalness: 1 },
  rubber: { color: '#1b1c1e', roughness: 0.9, metalness: 0 },
  medium: { color: '#f2cb1d', roughness: 0.6, metalness: 0, glow: 0.2 },
  rim: { color: '#202326', roughness: 0.35, metalness: 0.9 },
  fuel: { color: '#d9952c', roughness: 0.5, metalness: 0.1, glow: 0.12 },
  battery: { color: '#11a397', roughness: 0.4, metalness: 0.4, glow: 0.35 },
  disc: { color: '#3a3532', roughness: 0.7, metalness: 0.3 },
  hot: { color: '#ff5a1f', roughness: 0.6, metalness: 0, glow: 1.2 },
  redlight: { color: '#ff2a2a', roughness: 0.4, metalness: 0, glow: 2.5 },
  visor: { color: '#0a0c0e', roughness: 0.05, metalness: 0.9, clearcoat: 1 },
  helmet: { color: '#e9edf0', roughness: 0.3, metalness: 0.2, clearcoat: 1 },
  screen: { color: '#0aa89a', roughness: 0.2, metalness: 0, glow: 0.8 },
} satisfies Record<string, Spec>

export type MatKind = keyof typeof SPECS

/** Material for a mesh inside a <Part>. */
export function M({ kind, side }: { kind: MatKind; side?: THREE.Side }) {
  const part = useContext(PartCtx)
  const ref = useRef<THREE.MeshPhysicalMaterial>(null)
  const spec: Spec = SPECS[kind]
  const ownGlow = spec.glow ?? 0
  const ghost = part.ghost
  const transparent = ghost !== null || spec.opacity !== undefined
  const opacity = ghost ?? spec.opacity ?? 1

  useFrame(({ clock }) => {
    const m = ref.current
    if (!m) return
    const hl = part.selected ? 0.55 + 0.25 * Math.sin(clock.elapsedTime * 3.2) : part.hovered ? 0.35 : 0
    // Highlight tints the part with the accent; parts with their own glow keep it otherwise.
    if (hl > 0) m.emissive.copy(ACCENT)
    else m.emissive.set(spec.color)
    const target = hl > 0 ? hl : ownGlow
    m.emissiveIntensity += (target - m.emissiveIntensity) * 0.2
  })

  return (
    <meshPhysicalMaterial
      ref={ref}
      key={transparent ? 't' : 'o'}
      color={spec.color}
      roughness={spec.roughness}
      metalness={spec.metalness}
      clearcoat={spec.clearcoat ?? 0}
      clearcoatRoughness={0.15}
      vertexColors={spec.vertexColors ?? false}
      emissive={spec.color}
      emissiveIntensity={ownGlow}
      transparent={transparent}
      opacity={opacity}
      depthWrite={!transparent}
      side={side ?? THREE.FrontSide}
    />
  )
}

type Skinned = {
  m: THREE.MeshStandardMaterial
  transparent: boolean
  opacity: number
  depthWrite: boolean
  /** the material's own glow (lights, screens), kept under the highlight */
  emissive: THREE.Color | null
}

/**
 * The <M> behaviour for imported models: gives every mesh under `object` its own copy of its material,
 * then drives the highlight (emissive accent) and the X-ray fade from the surrounding <Part>.
 */
export function useSkin(object: THREE.Object3D) {
  const part = useContext(PartCtx)
  const skins = useMemo(() => {
    const list: Skinned[] = []
    object.traverse((o) => {
      const mesh = o as THREE.Mesh
      if (!mesh.isMesh) return
      const copy = (src: THREE.Material) => {
        const m = src.clone() as THREE.MeshStandardMaterial
        list.push({ m, transparent: m.transparent, opacity: m.opacity, depthWrite: m.depthWrite, emissive: m.emissive?.clone() ?? null })
        return m
      }
      mesh.material = Array.isArray(mesh.material) ? mesh.material.map(copy) : copy(mesh.material)
    })
    return list
  }, [object])

  useEffect(() => {
    for (const s of skins) {
      const g = part.ghost
      s.m.transparent = g !== null || s.transparent
      s.m.opacity = g === null ? s.opacity : Math.min(s.opacity, g)
      s.m.depthWrite = g === null ? s.depthWrite : false
      s.m.needsUpdate = true
    }
  }, [skins, part.ghost])

  const level = useRef(0)
  useFrame(({ clock }) => {
    // subtler than <M>: textured liveries should stay readable under the highlight
    const target = part.selected ? 0.16 + 0.08 * Math.sin(clock.elapsedTime * 3.2) : part.hovered ? 0.12 : 0
    level.current += (target - level.current) * 0.2
    const v = level.current < 0.003 ? 0 : level.current
    for (const s of skins) {
      if (!s.emissive) continue
      s.m.emissive.copy(ACCENT).multiplyScalar(v).add(s.emissive)
    }
  })
}
