import type { PersistedData, PersistedDataV1, Task, WindowBounds } from '../shared/types'

const STATUSES = ['not_started', 'wip', 'in_cr', 'done', 'archived']
const LEGACY_BLUR = ['off', 'light', 'strong']

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null
}

function isTask(v: unknown, depth = 0): v is Task {
  if (!isRecord(v)) return false
  if (typeof v.id !== 'string' || typeof v.title !== 'string') return false
  if (typeof v.status !== 'string' || !STATUSES.includes(v.status)) return false
  if (!Array.isArray(v.subtasks)) return false
  if (depth >= 1) return v.subtasks.length === 0
  return v.subtasks.every((s) => isTask(s, depth + 1))
}

/** The settings both file versions share: opacity, and optional blur and zoom. */
function hasValidCommonUi(ui: unknown): ui is Record<string, unknown> {
  return (
    isRecord(ui) &&
    typeof ui.opacity === 'number' &&
    (ui.zoom === undefined || typeof ui.zoom === 'number') &&
    (ui.blur === undefined ||
      typeof ui.blur === 'number' ||
      (typeof ui.blur === 'string' && LEGACY_BLUR.includes(ui.blur)))
  )
}

function hasValidTasks(v: Record<string, unknown>): boolean {
  return Array.isArray(v.tasks) && v.tasks.every((t) => isTask(t))
}

/** Current file format (version 2). */
export function isPersistedData(v: unknown): v is PersistedData {
  return (
    isRecord(v) &&
    v.version === 2 &&
    hasValidTasks(v) &&
    hasValidCommonUi(v.ui) &&
    typeof (v.ui as Record<string, unknown>).showArchived === 'boolean'
  )
}

function isPersistedDataV1(v: unknown): v is PersistedDataV1 {
  return (
    isRecord(v) &&
    v.version === 1 &&
    hasValidTasks(v) &&
    hasValidCommonUi(v.ui) &&
    typeof (v.ui as Record<string, unknown>).showCompleted === 'boolean'
  )
}

/** Any task file we know how to read, old or current. */
export function isStoredTasks(v: unknown): v is PersistedData | PersistedDataV1 {
  return isPersistedData(v) || isPersistedDataV1(v)
}

export function isWindowBounds(v: unknown): v is WindowBounds {
  return (
    isRecord(v) &&
    [v.x, v.y, v.width, v.height].every((n) => typeof n === 'number' && Number.isFinite(n))
  )
}
