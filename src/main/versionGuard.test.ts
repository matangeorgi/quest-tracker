import { mkdtempSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { describe, expect, it } from 'vitest'
import { isFromNewerVersion } from './versionGuard'

function fileWith(content: string): string {
  const file = join(mkdtempSync(join(tmpdir(), 'quest-tracker-')), 'tasks.json')
  writeFileSync(file, content)
  return file
}

describe('isFromNewerVersion', () => {
  it('is true for a file with a higher version', () => {
    expect(isFromNewerVersion(fileWith('{"version":3,"tasks":[]}'), 2)).toBe(true)
  })

  it('is false for the current or an older version', () => {
    expect(isFromNewerVersion(fileWith('{"version":2}'), 2)).toBe(false)
    expect(isFromNewerVersion(fileWith('{"version":1}'), 2)).toBe(false)
  })

  it('is false for a missing, broken or unrelated file', () => {
    expect(isFromNewerVersion(join(tmpdir(), 'does-not-exist.json'), 2)).toBe(false)
    expect(isFromNewerVersion(fileWith('{ not json'), 2)).toBe(false)
    expect(isFromNewerVersion(fileWith('[1,2]'), 2)).toBe(false)
  })
})
