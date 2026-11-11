import { contextBridge, ipcRenderer } from 'electron'
import type { PersistedData } from '../shared/types'

const api = {
  setCollapsed: (collapsed: boolean): void => ipcRenderer.send('window:set-collapsed', collapsed),
  setBlur: (amount: number): void => ipcRenderer.send('window:set-blur', amount),
  setZoom: (factor: number): void => ipcRenderer.send('window:set-zoom', factor),
  load: (): Promise<PersistedData | null> => ipcRenderer.invoke('store:load'),
  save: (data: PersistedData): void => ipcRenderer.send('store:save', data)
}

contextBridge.exposeInMainWorld('api', api)

export type Api = typeof api
