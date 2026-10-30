import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { byId } from './data/components'

export type AeroMode = 'corner' | 'straight'
export type CarModel = 'w17' | 'w14'

interface ExplorerState {
  selected: string | null
  hovered: string | null
  xray: boolean
  labels: boolean
  aero: AeroMode
  car: CarModel
  select: (id: string | null) => void
  hover: (id: string | null) => void
  setXray: (v: boolean) => void
  setLabels: (v: boolean) => void
  setAero: (m: AeroMode) => void
  setCar: (c: CarModel) => void
}

const Ctx = createContext<ExplorerState | null>(null)

export function ExplorerProvider({ children }: { children: ReactNode }) {
  const [selected, setSelected] = useState<string | null>(null)
  const [hovered, hover] = useState<string | null>(null)
  const [xray, setXray] = useState(false)
  const [labels, setLabels] = useState(true)
  const [aero, setAero] = useState<AeroMode>('corner')
  const [car, setCar] = useState<CarModel>('w17')

  const value = useMemo<ExplorerState>(
    () => ({
      selected,
      hovered,
      xray,
      labels,
      aero,
      car,
      select: (id) => {
        setSelected(id)
        // Parts that live under the bodywork are only visible in X-ray.
        if (id && byId[id]?.internal) setXray(true)
      },
      hover,
      setXray,
      setLabels,
      setAero,
      setCar,
    }),
    [selected, hovered, xray, labels, aero, car],
  )
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useExplorer() {
  const v = useContext(Ctx)
  if (!v) throw new Error('useExplorer outside ExplorerProvider')
  return v
}
