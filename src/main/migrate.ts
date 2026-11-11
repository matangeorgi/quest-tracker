import type { PersistedData, PersistedDataV1 } from '../shared/types'

/**
 * Brings an older tasks file up to the current format.
 * v1 -> v2: Done main tasks (which were hidden) become Archived. Sub-tasks keep
 * `done`, because that was only their checkbox.
 */
export function migrate(stored: PersistedData | PersistedDataV1): {
  data: PersistedData
  migrated: boolean
} {
  if (stored.version === 2) return { data: stored, migrated: false }

  const { showCompleted, ...ui } = stored.ui
  return {
    migrated: true,
    data: {
      version: 2,
      tasks: stored.tasks.map((task) =>
        task.status === 'done' ? { ...task, status: 'archived' } : task
      ),
      ui: { ...ui, showArchived: showCompleted }
    }
  }
}
