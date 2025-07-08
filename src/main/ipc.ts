import { ipcMain, BrowserWindow, Menu, MenuItem, screen } from 'electron'
import { createWindow, mainWindow, tabWindows, createMainTab, closeTab, setActiveTab, tabs, activeTabId, moveTab } from './window'
declare global {
    var userPopupWin: BrowserWindow | null | undefined;
}
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
        return {
            tabs: tabs.map(tab => {
                return {
                    id: tab.id,
                    url: tab.url,
                    title: tab.title,
                    favicon: tab.favicon,
                }
            }),
            active: activeTabId
        }
    })

    ipcMain.handle('tab:new', (e, url: string) => {
        const tab = createMainTab(url)
        tabs.push(tab)
        setActiveTab(tab.id)
        return {
            id: tab.id,
            url: tab.url,
            title: tab.title,
            favicon: tab.favicon,
        }
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
                    url: tab.url,
                    title: tab.title,
                    favicon: tab.favicon,
                }
            }),
            activeTabId,
        }
    })

    ipcMain.handle('tab:goto', (e, tabId: number, url: string) => {
        const tab = tabs.find((tab) => tab.id === tabId)
        if (tab) tab.view.webContents.loadURL(url)
    })

    ipcMain.handle('tab:move', (event, oldIndex: number, newIndex: number) => {
        moveTab(oldIndex, newIndex);
        // 同步最新tab顺序和当前活跃tab
        return {
            tabs: tabs.map(tab => ({
                id: tab.id,
                url: tab.url,
                title: tab.title,
                favicon: tab.favicon,
            })),
            active: activeTabId
        }
    });

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

        // 处理在指定标签页后插入新标签页的请求
    ipcMain.handle('tab:insert-after', (event, afterTabId: number, url: string) => {
        // 查找指定ID的标签页索引
        const idx = tabs.findIndex(t => t.id === afterTabId)
        // 如果标签页不存在，则不执行后续操作
        if (idx === -1) return
        
        // 创建新的标签页
        const tab = createMainTab(url)
        // 将新标签页插入到指定标签页之后
        tabs.splice(idx + 1, 0, tab)
        // 设置新标签页为活动标签页
        setActiveTab(tab.id)
        
        // 返回新标签页的相关信息
        return {
            id: tab.id,
            url: tab.url,
            title: tab.title,
            favicon: tab.favicon,
        }
    })
}
