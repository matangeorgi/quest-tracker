import koffi from 'koffi'
import type { BrowserWindow } from 'electron'

/** Blur radius when the slider is at 100%. */
export const MAX_BLUR_RADIUS = 40

interface NativeBlur {
  connection: number
  setRadius: (connection: number, windowId: number, radius: number) => number
}

// undefined = not tried yet, null = tried and not available.
let native: NativeBlur | null | undefined

/**
 * Uses CGSSetWindowBackgroundBlurRadius, an undocumented macOS function (the same
 * one Terminal uses for its background blur). Electron has no public way to set a
 * blur radius. If macOS ever removes it, the blur setting does nothing and the
 * rest of the app keeps working.
 */
function load(): NativeBlur | null {
  if (native !== undefined) return native
  try {
    const lib = koffi.load('/System/Library/Frameworks/CoreGraphics.framework/CoreGraphics')
    const mainConnection = lib.func('int CGSMainConnectionID()')
    const setRadius = lib.func('int CGSSetWindowBackgroundBlurRadius(int cid, uint32_t wid, int radius)')
    native = { connection: mainConnection(), setRadius }
  } catch (error) {
    console.error('Window blur is not available on this system:', error)
    native = null
  }
  return native
}

/** amount: 0 (no blur) to 1 (strongest). */
export function setWindowBlur(win: BrowserWindow, amount: number): void {
  if (process.platform !== 'darwin') return
  const api = load()
  if (!api) return
  // On macOS the media source id looks like "window:<window number>:0".
  const match = /^window:(\d+):/.exec(win.getMediaSourceId())
  if (!match) return
  const radius = Math.round(Math.min(1, Math.max(0, amount)) * MAX_BLUR_RADIUS)
  try {
    api.setRadius(api.connection, Number(match[1]), radius)
  } catch (error) {
    console.error('Could not set window blur:', error)
  }
}
