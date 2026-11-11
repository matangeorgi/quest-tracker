import { existsSync, readFileSync } from 'fs'

/**
 * True when the file was saved by a newer version of the app than this one.
 * This build cannot read it, so it must leave the file alone: no renaming it
 * as corrupt, and no saving over it.
 */
export function isFromNewerVersion(filePath: string, currentVersion: number): boolean {
  if (!existsSync(filePath)) return false
  try {
    const parsed: unknown = JSON.parse(readFileSync(filePath, 'utf8'))
    if (typeof parsed !== 'object' || parsed === null) return false
    const version = (parsed as { version?: unknown }).version
    return typeof version === 'number' && version > currentVersion
  } catch {
    return false
  }
}
