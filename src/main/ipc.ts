import { ipcMain, BrowserWindow, Menu, MenuItem, screen } from 'electron'
import { createTabWindow } from './window'
import path from 'node:path'

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
    ipcMain.on('tab:detach', (event, tabData) => createTabWindow(tabData))

    // Tab右键菜单
    ipcMain.handle('show-tab-context-menu', (event, tabMenuInfo) => {
        const win = BrowserWindow.fromWebContents(event.sender)
        if (!win || win.isDestroyed()) return
        const menu = new Menu()
        menu.append(new MenuItem({
            label: '在右侧新建标签页',
            click: () => win.webContents.send('tab-menu-action', { type: 'newRight', tab: tabMenuInfo })
        }))
        menu.append(new MenuItem({
            label: '关闭',
            accelerator: 'Ctrl+W',
            click: () => win.webContents.send('tab-menu-action', { type: 'close', tab: tabMenuInfo })
        }))
        menu.append(new MenuItem({
            label: '关闭右侧标签页',
            click: () => win.webContents.send('tab-menu-action', { type: 'closeRight', tab: tabMenuInfo })
        }))
        menu.append(new MenuItem({ type: 'separator' }))
        menu.append(new MenuItem({
            label: '重新加载',
            accelerator: 'Ctrl+R',
            click: () => win.webContents.send('tab-menu-action', { type: 'reload', tab: tabMenuInfo })
        }))
        menu.popup({ window: win, x: tabMenuInfo.x, y: tabMenuInfo.y })
    })
}
