import { ipcMain, BrowserWindow, Menu, MenuItem, screen } from 'electron'
import {
    createWindow, mainWindow, tabWindows,
    createWebTab, createPluginTab, createLocalTab,
    closeTab, setActiveTab, tabs, activeTabId, moveTab,
    getTabList, buildProtocolUrl
} from './window'
export function setupIpcHandlers(mainWindow: BrowserWindow, tabWindows: Set<BrowserWindow>) {
    // 窗口最大化/还原状态
    ipcMain.handle('win:isMaximized', () => mainWindow?.isMaximized())

    // 窗口最大化/还原事件
    mainWindow.on('maximize', () => mainWindow?.webContents.send('win:maximized'))
    mainWindow.on('unmaximize', () => mainWindow?.webContents.send('win:unmaximized'))

    ipcMain.on('win:action', (event, action) => {
        const win = BrowserWindow.fromWebContents(event.sender)
        if (!win || win.isDestroyed()) return
        switch (action) {
            case 'min': win.minimize(); break;
            case 'max': win.isMaximized() ? win.restore() : win.maximize(); break;
            case 'close': win.close(); break;
        }
    })

    ipcMain.handle('tab:get-list', () => {
        return getTabList()
    })

    ipcMain.handle('tab:new', (e, url: string) => {
        const tab = createWebTab(url)
        tabs.push(tab)
        setActiveTab(tab.id)
        return tab
    })

    ipcMain.handle('tab:new-plugin', (e, url: string) => {
        const tab = createPluginTab(url)
        tabs.push(tab)
        setActiveTab(tab.id)
        return tab
    })
    ipcMain.handle('tab:new-local', (e, pageName: string, pageProps: any) => {
        const tab = createLocalTab('local-page', pageName, pageProps)
        tabs.push(tab)
        setActiveTab(tab.id)
        return tab
    })
    ipcMain.handle('tab:new-console', (e, pageName: string, pageProps: any) => {
        const tab = createLocalTab('console', pageName, pageProps)
        tabs.push(tab)
        setActiveTab(tab.id)
        return tab
    })

    ipcMain.handle('tab:switch', (e, tabId: number) => {
        setActiveTab(tabId)
    })

    ipcMain.handle('tab:close', (e, tabId: number) => {
        closeTab(tabId)
        return {
            tabs: tabs.map((tab) => {
                return {
                    id: tab.id,
                    type: tab.type,
                    url: tab.url,
                    title: tab.title,
                    favicon: tab.favicon,
                    pageName: tab.pageName,
                    pageProps: tab.pageProps
                }
            }),
            activeTabId,
        }
    })

    ipcMain.handle('tab:goto', (e, tabId: number, url: string) => {
        const tab = tabs.find((tab) => tab.id === tabId)
        if (tab && (tab.type === 'web' || tab.type === 'plugin') && tab.view) {
            tab.view.webContents.loadURL(url)
        }
    })

    ipcMain.handle('tab:move', (event, oldIndex: number, newIndex: number) => {
        moveTab(oldIndex, newIndex);
        // 同步最新tab顺序和当前活跃tab
        return {
            tabs: tabs.map(tab => ({
                id: tab.id,
                type: tab.type,
                url: tab.url,
                title: tab.title,
                favicon: tab.favicon,
                pageName: tab.pageName,
                pageProps: tab.pageProps
            })),
            active: activeTabId
        }
    });

    // 处理在指定标签页后插入新标签页的请求
    ipcMain.handle('tab:insert-after', (event, afterTabId: number, info: any) => {
        const idx = tabs.findIndex(t => t.id === afterTabId)
        if (idx === -1) return
        let tab: ReturnType<typeof createWebTab | typeof createLocalTab | typeof createPluginTab>
        if (info.type === 'web') tab = createWebTab(info.url)
        else if (info.type === 'plugin') tab = createPluginTab(info.url)
        else if (info.type === 'console') tab = createLocalTab('console', info.pageName, info.pageProps)
        else tab = createLocalTab('local-page', info.pageName, info.pageProps)
        tabs.splice(idx + 1, 0, tab)
        setActiveTab(tab.id)
        return tab
    })

    ipcMain.handle('tab:set-input-draft', (e, tabId: number, draft: string) => {
        const tab = tabs.find(t => t.id === tabId)
        if (tab) tab.inputDraft = draft // 保存在tab对象结构里
    })

    ipcMain.handle('tab:replace', (e, tabId: number, info: InsertTabInfo) => {
        const tab = tabs.find(t => t.id === tabId)
        if (!tab) return;

        // --- 通用:总是先移除view ---
        if (tab.view) {
            try { mainWindow!.removeBrowserView(tab.view) } catch { }
            const wc = tab.view.webContents as any
            if (wc && wc.destroy) wc.destroy()
            tab.view = undefined
        }

        // --- 新内容类型分支 ---
        if (info.type === 'web') {
            const newTab = createWebTab(info.url)
            Object.assign(tab, newTab, { id: tab.id })
        } else if (info.type === 'plugin') {
            const newTab = createPluginTab(info.url)
            Object.assign(tab, newTab, { id: tab.id })
        } else if (info.type === 'local-page' || info.type === 'console') {
            tab.type = info.type
            tab.pageName = info.pageName
            tab.pageProps = info.pageProps
            tab.title = info.pageProps?.title
            tab.protocolUrl = buildProtocolUrl(tab)
            tab.url = undefined
            tab.favicon = undefined
            // 🔥!!! tab.view 必须置空，见上
            // 🔥!!! nothing to do
        }

        // 保持history一致（一般replace即新开页，history重置）
        tab.history = [info.url ?? ''];
        tab.currentHistoryIndex = 0;
        setActiveTab(tab.id)
        return tab
    })

    ipcMain.handle("tab:go-back", (e, tabId: number) => {
        const tab = tabs.find(t => t.id === tabId)
        if (!tab || !tab.view) return;
        // 让webContents后退（以webContents为准）
        if (tab.view.webContents.canGoBack()) {
            tab.view.webContents.goBack();
        }
    })
    ipcMain.handle("tab:go-forward", (e, tabId: number) => {
        const tab = tabs.find(t => t.id === tabId)
        if (!tab || !tab.view) return;
        if (tab.view.webContents.canGoForward()) {
            tab.view.webContents.goForward();
        }
    })
    ipcMain.handle("tab:get-history", (e, tabId: number, limit: number = 10) => {
        const tab = tabs.find(t => t.id === tabId)
        if (!tab || !tab.history) return { history: [], current: -1 };
        // 限制数量
        const len = tab.history.length;
        let start = Math.max(0, len - limit);
        return {
            history: tab.history.slice(start),
            current: tab.currentHistoryIndex - start
        }
    })

    // Tab右键菜单
    ipcMain.handle('show-tab-context-menu', (event, tabMenuInfo) => {
        const win = BrowserWindow.fromWebContents(event.sender)
        if (!win || win.isDestroyed()) return
        function isLastTab() {
            return tabMenuInfo.index === tabMenuInfo.total - 1
        }
        const menu = new Menu()
        // 新建在右侧
        menu.append(new MenuItem({
            label: '在右侧新建标签页',
            click: () => win.webContents.send('tab-menu-action', { type: 'newRight', tab: tabMenuInfo })
        }))

        menu.append(new MenuItem({ type: 'separator' }))

        // 复制
        menu.append(new MenuItem({
            label: '复制',
            click: () => win.webContents.send('tab-menu-action', { type: 'copy', tab: tabMenuInfo })
        }))
        menu.append(new MenuItem({
            label: '重新加载',
            accelerator: 'Ctrl+R',
            click: () => win.webContents.send('tab-menu-action', { type: 'reload', tab: tabMenuInfo })
        }))

        menu.append(new MenuItem({ type: 'separator' }))

        // 关闭
        menu.append(new MenuItem({
            label: '关闭',
            accelerator: 'Ctrl+W',
            click: () => win.webContents.send('tab-menu-action', { type: 'close', tab: tabMenuInfo })
        }))
        // 关闭其他标签
        menu.append(new MenuItem({
            label: '关闭其他标签页',
            click: () => win.webContents.send('tab-menu-action', { type: 'closeOthers', tab: tabMenuInfo })
        }))
        // 关闭右侧标签
        menu.append(new MenuItem({
            label: '关闭右侧标签页',
            enabled: !isLastTab(),
            click: () => win.webContents.send('tab-menu-action', { type: 'closeRight', tab: tabMenuInfo })
        }))

        menu.popup({ window: win, x: tabMenuInfo.x, y: tabMenuInfo.y })
    })


}
