import { contextBridge, ipcRenderer, clipboard } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import type { InsertTabInfo } from '../renderer/src/types/window'

const tabApi = {
    getTabList: () => ipcRenderer.invoke('tab:get-list'),
    replaceTab: (tabId: number, info: InsertTabInfo) => ipcRenderer.invoke('tab:replace', tabId, info),
    newTab: (url: string) => ipcRenderer.invoke('tab:new', url),
    newPluginTab: (url: string) => ipcRenderer.invoke('tab:new-plugin', url),
    newLocalTab: (pageName: string, pageProps?: any) => ipcRenderer.invoke('tab:new-local', pageName, pageProps),
    newConsoleTab: (pageName: string, pageProps?: any) => ipcRenderer.invoke('tab:new-console', pageName, pageProps),
    switchTab: (id: number) => ipcRenderer.invoke('tab:switch', id),
    closeTab: (id: number) => ipcRenderer.invoke('tab:close', id),
    gotoTabUrl: (id: number, url: string) => ipcRenderer.invoke('tab:goto', id, url),
    moveTab: (oldIndex: number, newIndex: number) => ipcRenderer.invoke('tab:move', oldIndex, newIndex),
    insertTabAfter: (afterTabId: number, info: any) => ipcRenderer.invoke('tab:insert-after', afterTabId, info),
    // 监听事件
    onTitleUpdated: (cb: (e: any, data: any) => void) => ipcRenderer.on('tab:title-updated', cb),
    onFaviconUpdated: (cb: (e: any, data: any) => void) => ipcRenderer.on('tab:favicon-updated', cb),
    onUrlUpdated: (cb: (e: any, data: any) => void) => ipcRenderer.on('tab:url-updated', cb),
    onActiveChanged: (cb: (e: any, id: number) => void) => ipcRenderer.on('tab:active-changed', cb),
    onOrderUpdated: (cb) => ipcRenderer.on('tab:order-updated', cb),
    showTabContextMenu: (tabMenuInfo: any) => ipcRenderer.invoke('show-tab-context-menu', tabMenuInfo),
    tabMenuAction: (cb: (e: any, data: { type: string, tab: any }) => void) => ipcRenderer.on('tab-menu-action', cb),
    offTabMenuAction: (cb: any) => ipcRenderer.off('tab-menu-action', cb),
    setInputDraft: (tabId: number, draft: string) => ipcRenderer.invoke('tab:set-input-draft', tabId, draft),

    gotoOrReplace: (tabId: number, entry) => ipcRenderer.invoke('tab:goto-or-replace', tabId, entry),
    goBack: (id: number) => ipcRenderer.invoke("tab:go-back", id),
    goForward: (id: number) => ipcRenderer.invoke("tab:go-forward", id),
    getHistory: (tabId: number, limit: number = 10) => ipcRenderer.invoke("tab:get-history", tabId, limit),
    onHistoryUpdated: (cb: (e: any, data: any) => void) => ipcRenderer.on("tab:history-updated", cb),
    gotoHistoryIndex: (tabId: number, index: number) => ipcRenderer.invoke('tab:goto-history-index', tabId, index),
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
