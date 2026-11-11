import { describe, expect, it } from 'vitest'
import { migrate } from './migrate'
import { isPersistedData, isStoredTasks } from './validate'
import type { PersistedData, PersistedDataV1 } from '../shared/types'

const v1: PersistedDataV1 = {
  version: 1,
  tasks: [
    {
      id: 'a',
      title: 'A',
      status: 'done',
      subtasks: [{ id: 'a1', title: 'A1', status: 'done', subtasks: [] }]
    },
    { id: 'b', title: 'B', status: 'wip', subtasks: [] }
  ],
  ui: { opacity: 0.5, showCompleted: true, blur: 0.4, zoom: 0.9 }
}

describe('migrate', () => {
  it('turns Done main tasks into Archived and keeps sub-tasks as they were', () => {
    const { data, migrated } = migrate(v1)
    expect(migrated).toBe(true)
    expect(data.tasks[0].status).toBe('archived')
    expect(data.tasks[0].subtasks[0].status).toBe('done')
    expect(data.tasks[1].status).toBe('wip')
  })

  it('renames showCompleted to showArchived and keeps the other settings', () => {
    const { data } = migrate(v1)
    expect(data.ui).toEqual({ opacity: 0.5, showArchived: true, blur: 0.4, zoom: 0.9 })
    expect(isPersistedData(data)).toBe(true)
  })

  it('leaves current files alone, so new Done tasks are not archived on the next launch', () => {
    const current: PersistedData = {
      version: 2,
      tasks: [{ id: 'a', title: 'A', status: 'done', subtasks: [] }],
      ui: { opacity: 1, showArchived: false }
    }
    const result = migrate(current)
    expect(result.migrated).toBe(false)
    expect(result.data.tasks[0].status).toBe('done')
  })

  it('accepts both file versions and rejects anything else', () => {
    expect(isStoredTasks(v1)).toBe(true)
    expect(isStoredTasks(migrate(v1).data)).toBe(true)
    expect(isStoredTasks({ ...v1, version: 3 })).toBe(false)
    expect(isStoredTasks({ ...v1, ui: { opacity: 1 } })).toBe(false)
  })
})
