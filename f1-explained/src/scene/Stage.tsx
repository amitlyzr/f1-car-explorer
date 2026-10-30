import { Suspense, useEffect, useMemo, useRef, type RefObject } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame } from '@react-three/fiber'
import { CameraControls, ContactShadows, Environment, Grid, Lightformer } from '@react-three/drei'
import { Car } from './Car'
import { ModelCar } from './ModelCar'
import { COMPONENTS, byId, type Vec3 } from '../data/components'
import { useExplorer } from '../state'

const HOME: { pos: Vec3; target: Vec3 } = { pos: [5.0, 2.0, 4.8], target: [0.25, 0.25, 0] }

function Rig() {
  const ref = useRef<CameraControls>(null)
  const { selected } = useExplorer()
  const touched = useRef(false)

  useEffect(() => {
    const c = ref.current
    if (!c) return
    const v = selected ? byId[selected].cam : HOME
    // close-ups are authored tight; pull back a little so the part keeps its context
    const k = selected ? 1.45 : 1
    const [tx, ty, tz] = v.target
    const [px, py, pz] = v.pos
    c.setLookAt(tx + (px - tx) * k, ty + (py - ty) * k, tz + (pz - tz) * k, tx, ty, tz, true)
  }, [selected])

  // A slow turntable until the visitor takes the wheel.
  useFrame((_, dt) => {
    if (!touched.current && !selected && ref.current) ref.current.azimuthAngle += dt * 0.07
  })

  return (
    <CameraControls
      ref={ref}
      makeDefault
      smoothTime={0.55}
      minDistance={1.4}
      maxDistance={11}
      maxPolarAngle={Math.PI / 2 - 0.04}
      onStart={() => (touched.current = true)}
    />
  )
}

/** Projects every pin to screen space each frame and moves its DOM button (rendered outside the canvas). */
function PinTracker({ els }: { els: RefObject<(HTMLButtonElement | null)[]> }) {
  const v = useMemo(() => new THREE.Vector3(), [])
  useFrame(({ camera, size }) => {
    COMPONENTS.forEach((c, i) => {
      const el = els.current[i]
      if (!el) return
      v.set(...c.pin).project(camera)
      const behind = v.z > 1
      el.style.transform = `translate(${((v.x + 1) / 2) * size.width}px, ${((1 - v.y) / 2) * size.height}px)`
      el.style.opacity = behind ? '0' : ''
    })
  })
  return null
}

function Pins({ els }: { els: RefObject<(HTMLButtonElement | null)[]> }) {
  const { labels, xray, selected, hovered, select, hover } = useExplorer()
  return (
    <div className="pins">
      {COMPONENTS.map((c, i) => {
        const hidden = !labels || (c.internal && !xray)
        const active = selected === c.id || hovered === c.id
        return (
          <button
            key={c.id}
            ref={(el) => {
              els.current[i] = el
            }}
            className={`pin${active ? ' is-active' : ''}${c.internal ? ' is-internal' : ''}${hidden ? ' is-hidden' : ''}`}
            tabIndex={hidden ? -1 : 0}
            onClick={() => select(c.id)}
            onMouseEnter={() => hover(c.id)}
            onMouseLeave={() => hover(null)}
            aria-label={c.name}
          >
            <span className="pin-dot">{String(i + 1).padStart(2, '0')}</span>
            <span className="pin-label">{c.name}</span>
          </button>
        )
      })}
    </div>
  )
}

export function Stage() {
  const { select } = useExplorer()
  const down = useRef<[number, number]>([0, 0])
  const pinEls = useRef<(HTMLButtonElement | null)[]>([])
  return (
    <>
      <Canvas
        onPointerDown={(e) => (down.current = [e.clientX, e.clientY])}
        shadows={false}
        dpr={[1, 2]}
        camera={{ position: HOME.pos, fov: 34, near: 0.1, far: 80 }}
        gl={{ antialias: true, alpha: true }}
        onPointerMissed={(e) => {
          // a click on empty space (not the end of a drag) clears the selection
          const [x, y] = down.current
          if (e.type === 'click' && Math.hypot(e.clientX - x, e.clientY - y) < 6) select(null)
        }}
      >
        <ambientLight intensity={0.25} />
        <directionalLight position={[4, 6, 3]} intensity={1.4} />
        <directionalLight position={[-5, 3, -4]} intensity={0.6} color="#9fe8df" />

        <Environment resolution={256} frames={1}>
          <Lightformer form="rect" intensity={3} position={[0, 5, 0]} rotation-x={Math.PI / 2} scale={[10, 2, 1]} />
          <Lightformer form="rect" intensity={2} position={[0, 4, 3]} rotation-x={Math.PI / 2.5} scale={[10, 1, 1]} />
          <Lightformer form="rect" intensity={2} position={[0, 4, -3]} rotation-x={-Math.PI / 2.5} scale={[10, 1, 1]} />
          <Lightformer
            form="rect"
            intensity={1.2}
            color="#00d2be"
            position={[-6, 1, 0]}
            rotation-y={Math.PI / 2}
            scale={[8, 0.4, 1]}
          />
          <Lightformer
            form="rect"
            intensity={1.5}
            position={[6, 1.5, 0]}
            rotation-y={-Math.PI / 2}
            scale={[8, 0.6, 1]}
          />
          <Lightformer form="ring" intensity={1} position={[0, 2, 8]} scale={3} />
        </Environment>

        {/* the hand-built car stands in while the real models download */}
        <Suspense
          fallback={
            <>
              <Car />
              <ContactShadows position={[0, 0.001, 0]} scale={9} blur={2.4} far={1.2} opacity={0.75} resolution={1024} frames={1} />
            </>
          }
        >
          <ModelCar />
        </Suspense>
        <PinTracker els={pinEls} />
        <Grid
          position={[0, -0.001, 0]}
          infiniteGrid
          cellSize={0.25}
          sectionSize={1}
          cellThickness={0.6}
          sectionThickness={1}
          cellColor="#1c2328"
          sectionColor="#24414a"
          fadeDistance={16}
          fadeStrength={2.2}
        />
        <Rig />
      </Canvas>
      <Pins els={pinEls} />
    </>
  )
}
