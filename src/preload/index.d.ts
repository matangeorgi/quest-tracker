import type { PersistedData } from '../shared/types'

declare global {
  interface Window {
    api: {
      setCollapsed: (collapsed: boolean) => void
      /** 0 (no blur) – 1 (strongest). */
      setBlur: (amount: number) => void
      /** Text and row size: 0.7 (small) – 1.3 (large), 1 = normal. */
      setZoom: (factor: number) => void
      load: () => Promise<PersistedData | null>
      save: (data: PersistedData) => void
    }
  }
}

export {}
