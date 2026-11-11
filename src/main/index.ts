import { app, BrowserWindow, ipcMain, Menu, nativeImage, screen, shell, Tray } from 'electron'
import { join } from 'path'
import { is, optimizer } from '@electron-toolkit/utils'
import { copyFileSync } from 'fs'
import { migrate } from './migrate'
import { createJsonStore, type JsonStore } from './store'
import { isPersistedData, isStoredTasks, isWindowBounds } from './validate'
import { isFromNewerVersion } from './versionGuard'
import { setWindowBlur } from './windowBlur'
import {
  DATA_VERSION,
  MAX_ZOOM,
  MIN_ZOOM,
  type PersistedData,
  type PersistedDataV1,
  type WindowBounds
} from '../shared/types'

const WIDTH = 340
const HEIGHT = 520
const COLLAPSED_HEIGHT = 34 // header (32) + panel border (2), at 100% size
const MIN_WIDTH = 280
const MIN_HEIGHT = 200
const MARGIN = 16

let win: BrowserWindow | null = null
let tray: Tray | null = null
let tasksStore: JsonStore<PersistedData | PersistedDataV1>
let windowStore: JsonStore<WindowBounds>
let collapsed = false
let zoomFactor = 1 // text/row size; the collapsed bar scales with it
let expandedHeight = HEIGHT // height to restore after collapsing

/** Saved bounds if they are still on a connected screen, else top-right. */
function initialBounds(saved: WindowBounds | null): WindowBounds {
  const { workArea } = screen.getPrimaryDisplay()
  const fallback = {
    x: workArea.x + workArea.width - WIDTH - MARGIN,
    y: workArea.y + MARGIN,
    width: WIDTH,
    height: HEIGHT
  }
  if (!saved) return fallback
  const px = saved.x + 20
  const py = saved.y + 20
  const onScreen = screen
    .getAllDisplays()
    .some(
      ({ workArea: a }) => px >= a.x && px < a.x + a.width && py >= a.y && py < a.y + a.height
    )
  if (!onScreen) return fallback
  return {
    ...saved,
    width: Math.max(saved.width, MIN_WIDTH),
    height: Math.max(saved.height, MIN_HEIGHT)
  }
}

function createWindow(): BrowserWindow {
  const bounds = initialBounds(windowStore.load())
  expandedHeight = bounds.height

  const w = new BrowserWindow({
    ...bounds,
    show: false,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    hasShadow: false, // a shadow looks wrong on a transparent rounded shape
    alwaysOnTop: true,
    skipTaskbar: true,
    fullscreenable: false,
    resizable: true,
    minWidth: MIN_WIDTH,
    minHeight: MIN_HEIGHT,
    type: 'panel', // macOS non-activating panel: pinned popup, does not steal focus
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      sandbox: true
    }
  })

  w.setAlwaysOnTop(true, 'screen-saver') // above full-screen apps
  w.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })

  // Remember where the user put it. While collapsed we keep the expanded height.
  const persistBounds = (): void => {
    const b = w.getBounds()
    windowStore.save({ x: b.x, y: b.y, width: b.width, height: collapsed ? expandedHeight : b.height })
  }
  w.on('moved', persistBounds)
  w.on('resized', persistBounds)

  w.once('ready-to-show', () => w.showInactive())

  w.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    w.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    w.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return w
}

function toggleVisibility(): void {
  if (!win) return
  if (win.isVisible()) win.hide()
  else win.showInactive()
}

function createTray(): void {
  // Text-only menu bar item, so no icon asset is needed.
  tray = new Tray(nativeImage.createEmpty())
  tray.setTitle('⚔ Quests')
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: 'Show / Hide', click: toggleVisibility },
      {
        label: 'Start at login',
        type: 'checkbox',
        checked: app.getLoginItemSettings().openAtLogin,
        // In dev this would register the bare Electron binary, so only the built app can use it.
        enabled: app.isPackaged,
        click: (item) => app.setLoginItemSettings({ openAtLogin: item.checked })
      },
      { type: 'separator' },
      { label: 'Quit Quest Tracker', click: () => app.quit() }
    ])
  )
}

app.whenReady().then(() => {
  app.dock?.hide() // no Dock icon; the tray is the way to show/hide/quit

  const dataDir = app.getPath('userData')
  const tasksFile = join(dataDir, 'tasks.json')
  tasksStore = createJsonStore(tasksFile, isStoredTasks)
  // A newer app saved this file. We can't read it, so show dummy tasks and never write to it.
  const tasksLocked = isFromNewerVersion(tasksFile, DATA_VERSION)
  windowStore = createJsonStore(join(dataDir, 'window.json'), isWindowBounds)

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  ipcMain.handle('store:load', () => {
    if (tasksLocked) return null
    const stored = tasksStore.load()
    if (!stored) return null
    const { data, migrated } = migrate(stored)
    if (migrated) {
      // Keep a copy of the old file once, then write the new format.
      try {
        copyFileSync(tasksFile, join(dataDir, 'tasks.v1.backup.json'))
      } catch {
        // the backup is a bonus; do not block the upgrade
      }
      tasksStore.save(data)
    }
    return data
  })
  ipcMain.on('store:save', (_event, data: unknown) => {
    if (!tasksLocked && isPersistedData(data)) tasksStore.save(data)
  })

  // Blur the desktop behind the panel. amount: 0 – 1.
  ipcMain.on('window:set-blur', (_event, amount: unknown) => {
    if (win && typeof amount === 'number' && Number.isFinite(amount)) setWindowBlur(win, amount)
  })

  // Make text and rows bigger or smaller (like browser zoom). factor: MIN_ZOOM – MAX_ZOOM.
  ipcMain.on('window:set-zoom', (_event, factor: unknown) => {
    if (!win || typeof factor !== 'number' || !Number.isFinite(factor)) return
    zoomFactor = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, factor))
    win.webContents.setZoomFactor(zoomFactor)
  })

  // Collapse = shrink to the header bar (top edge and width stay). Expanding
  // restores the height the user had resized to. Resizing is off while collapsed.
  ipcMain.on('window:set-collapsed', (_event, shouldCollapse: boolean) => {
    if (!win) return
    const { width, height } = win.getBounds()
    if (shouldCollapse) {
      const collapsedHeight = Math.round(COLLAPSED_HEIGHT * zoomFactor)
      expandedHeight = height
      collapsed = true
      win.setMinimumSize(MIN_WIDTH, collapsedHeight)
      win.setSize(width, collapsedHeight)
      win.setResizable(false)
    } else {
      collapsed = false
      win.setResizable(true)
      win.setMinimumSize(MIN_WIDTH, MIN_HEIGHT)
      win.setSize(width, expandedHeight)
    }
  })

  win = createWindow()
  createTray()
})

// Write any change still waiting for its delay before the app exits.
app.on('before-quit', () => {
  tasksStore?.flush()
  windowStore?.flush()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
