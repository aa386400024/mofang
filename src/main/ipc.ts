import { ipcMain, BrowserWindow, Menu, MenuItem } from 'electron'
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

    ipcMain.handle('show-user-popup', (event, { x, y }: { x: number, y: number }) => {
        // 如果已有，先关闭
        if (global.userPopupWin && !global.userPopupWin.isDestroyed()) {
            global.userPopupWin.close();
        }

        // 创建弹窗
        global.userPopupWin = new BrowserWindow({
            width: 320,
            height: 640,
            x,
            y,
            show: false, // readyToShow后再show
            frame: false,
            resizable: false,
            movable: false,
            skipTaskbar: true,
            transparent: false,
            parent: BrowserWindow.fromWebContents(event.sender) || undefined, // 父窗口
            alwaysOnTop: true,
            webPreferences: {
                preload: path.join(__dirname, '../preload/index.js'),
                nodeIntegration: false,
                contextIsolation: true
            }
        });

        // dev下打开devtools
        // global.userPopupWin.webContents.openDevTools({ mode: 'detach' });

        // dev和build/生产下区分加载
        const DEV_SERVER_URL = process.env['ELECTRON_RENDERER_URL'];
        if (DEV_SERVER_URL) {
            const url = `${DEV_SERVER_URL}/#/user-popup`
            global.userPopupWin.loadURL(url)

        } else {
            global.userPopupWin.loadFile(path.join(__dirname, '../renderer/index.html'), {
                hash: '/user-popup'
            });
        }

        // 等待加载好再show
        global.userPopupWin.once('ready-to-show', () => {
            global.userPopupWin && global.userPopupWin.show();
        });

        // 失焦或关闭时自动销毁
        global.userPopupWin.on('blur', () => {
            global.userPopupWin && global.userPopupWin.close();
        });

        global.userPopupWin.on('closed', () => {
            global.userPopupWin = null;
            mainWindow?.webContents.send('user-popup-closed');
        });
    });

}
