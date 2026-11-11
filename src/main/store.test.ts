import { existsSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { describe, expect, it } from 'vitest'
import { createJsonStore } from './store'
import { isPersistedData } from './validate'
import type { PersistedData } from '../shared/types'

const sample: PersistedData = {
  version: 2,
  tasks: [{ id: 'a', title: 'A', status: 'wip', subtasks: [] }],
  ui: { opacity: 0.7, showArchived: true }
}

function tempFile(): string {
  return join(mkdtempSync(join(tmpdir(), 'quest-tracker-')), 'tasks.json')
}

describe('createJsonStore', () => {
  it('returns null when the file does not exist', () => {
    expect(createJsonStore(tempFile(), isPersistedData).load()).toBeNull()
  })

  it('saves and loads the same data after flush', () => {
    const file = tempFile()
    const store = createJsonStore(file, isPersistedData)
    store.save(sample)
    store.flush()
    expect(createJsonStore(file, isPersistedData).load()).toEqual(sample)
    expect(existsSync(`${file}.tmp`)).toBe(false)
  })

  it('writes only the latest value', () => {
    const file = tempFile()
    const store = createJsonStore(file, isPersistedData)
    store.save({ ...sample, ui: { opacity: 0.4, showArchived: false } })
    store.save(sample)
    store.flush()
    expect(JSON.parse(readFileSync(file, 'utf8')).ui.opacity).toBe(0.7)
  })

  it('keeps a backup and returns null for a corrupt file', () => {
    const file = tempFile()
    writeFileSync(file, '{ not json')
    expect(createJsonStore(file, isPersistedData).load()).toBeNull()
    expect(existsSync(file)).toBe(false)
    expect(readdirSync(join(file, '..')).some((f) => f.includes('.corrupt-'))).toBe(true)
  })

  it('rejects data with the wrong shape', () => {
    const file = tempFile()
    writeFileSync(file, JSON.stringify({ version: 2, tasks: [{ id: 1 }], ui: {} }))
    expect(createJsonStore(file, isPersistedData).load()).toBeNull()
  })
})
