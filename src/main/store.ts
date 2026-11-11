import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'fs'
import { dirname } from 'path'

export interface JsonStore<T> {
  /** Returns the saved value, or null if the file is missing or invalid. */
  load: () => T | null
  /** Schedules a write. Only the latest value is written. */
  save: (value: T) => void
  /** Writes any pending value now. Call before quitting. */
  flush: () => void
}

export function createJsonStore<T>(
  filePath: string,
  isValid: (value: unknown) => value is T,
  debounceMs = 250
): JsonStore<T> {
  let pending: T | undefined
  let timer: ReturnType<typeof setTimeout> | undefined

  function load(): T | null {
    if (!existsSync(filePath)) return null
    try {
      const parsed: unknown = JSON.parse(readFileSync(filePath, 'utf8'))
      if (isValid(parsed)) return parsed
    } catch {
      // fall through to the backup below
    }
    // Keep the unreadable file instead of overwriting it.
    try {
      renameSync(filePath, `${filePath}.corrupt-${Date.now()}`)
    } catch {
      // nothing more we can do
    }
    return null
  }

  function flush(): void {
    if (timer) clearTimeout(timer)
    timer = undefined
    if (pending === undefined) return
    const value = pending
    pending = undefined
    mkdirSync(dirname(filePath), { recursive: true })
    // Write to a temp file, then rename: a crash never leaves half a file.
    const tmp = `${filePath}.tmp`
    writeFileSync(tmp, JSON.stringify(value, null, 2))
    renameSync(tmp, filePath)
  }

  function save(value: T): void {
    pending = value
    if (timer) clearTimeout(timer)
    timer = setTimeout(flush, debounceMs)
  }

  return { load, save, flush }
}
