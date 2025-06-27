import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  /**
   * 控制窗口: min|max|close
   */
  win: (action: 'min' | 'max' | 'close') => ipcRenderer.send('win:action', action),
  isMaximized: () => ipcRenderer.invoke('win:isMaximized'),
  onMaximize: (cb: () => void) => ipcRenderer.on('win:maximized', cb),
  onUnmaximize: (cb: () => void) => ipcRenderer.on('win:unmaximized', cb),

  // Tab 拆分
  detachTab: (tab: any) => ipcRenderer.send('tab:detach', tab),
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
