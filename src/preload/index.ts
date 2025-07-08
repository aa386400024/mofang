import { contextBridge, ipcRenderer, clipboard } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

const tabApi = {
    getTabList: ()=>ipcRenderer.invoke('tab:get-list'),
    newTab:    (url: string)=>ipcRenderer.invoke('tab:new', url),
    switchTab: (id: number)=>ipcRenderer.invoke('tab:switch', id),
    closeTab:  (id: number)=>ipcRenderer.invoke('tab:close', id),
    gotoTabUrl: (id: number, url: string)=>ipcRenderer.invoke('tab:goto', id, url),
    moveTab: (oldIndex: number, newIndex: number)=>ipcRenderer.invoke('tab:move', oldIndex, newIndex),
    // 监听事件
    onTitleUpdated: (cb: (e: any, data:any)=>void) => ipcRenderer.on('tab:title-updated', cb),
    onFaviconUpdated: (cb: (e: any, data:any)=>void) => ipcRenderer.on('tab:favicon-updated', cb),
    onUrlUpdated: (cb: (e: any, data:any)=>void) => ipcRenderer.on('tab:url-updated', cb),
    onActiveChanged: (cb: (e:any, id:number)=>void) => ipcRenderer.on('tab:active-changed', cb),
    onOrderUpdated:   (cb) => ipcRenderer.on('tab:order-updated', cb),
    showTabContextMenu: (tabMenuInfo: any) => ipcRenderer.invoke('show-tab-context-menu', tabMenuInfo),
    tabMenuAction: (cb: (e: any, data: { type: string, tab: any }) => void) => ipcRenderer.on('tab-menu-action', cb),
    offTabMenuAction: (cb: any) => ipcRenderer.off('tab-menu-action', cb),
    insertTabAfter: (afterTabId: number, url: string) => ipcRenderer.invoke('tab:insert-after', afterTabId, url),
  }

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

    clipboard: {
        writeText: (text: string) => clipboard.writeText(text),
        readText: () => clipboard.readText()
    },

    tab: tabApi
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
