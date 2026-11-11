/**
 * Main tasks use all five. Sub-tasks only use not_started and done (their checkbox).
 * `done` stays in the list, below a divider. `archived` is hidden behind a toggle.
 */
export type Status = 'not_started' | 'wip' | 'in_cr' | 'done' | 'archived'

export interface Task {
  id: string
  title: string
  status: Status
  /** One level only: sub-tasks never have their own sub-tasks. */
  subtasks: Task[]
}

/** Older builds saved blur as one of these words instead of a number. */
export type LegacyBlur = 'off' | 'light' | 'strong'

export interface UiSettings {
  /** Panel background opacity, 0.3 – 1. */
  opacity: number
  showArchived: boolean
  /** Background blur, 0 – 1. Missing in old files (treat as 0); may be a legacy word. */
  blur?: number | LegacyBlur
  /** Text and row size, MIN_ZOOM – MAX_ZOOM (1 = normal). Missing in old files. */
  zoom?: number
}

export const MIN_ZOOM = 0.7
export const MAX_ZOOM = 1.3
export const ZOOM_STEP = 0.1

/** Bump this when the saved file changes shape, and add a step in src/main/migrate.ts. */
export const DATA_VERSION = 2

export interface PersistedData {
  version: 2
  tasks: Task[]
  ui: UiSettings
}

/**
 * Format before "Archived" existed. There, a Done main task was hidden in the
 * Completed list, so on upgrade those tasks become Archived.
 */
export interface PersistedDataV1 {
  version: 1
  tasks: Task[]
  ui: Omit<UiSettings, 'showArchived'> & { showCompleted: boolean }
}

export interface WindowBounds {
  x: number
  y: number
  width: number
  height: number
}

export const DEFAULT_UI: UiSettings = { opacity: 0.85, showArchived: false }
