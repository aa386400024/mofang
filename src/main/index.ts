import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'

let mainWindow: BrowserWindow | null = null
let tabWindows: Set<BrowserWindow> = new Set()
export function createTabWindow(tabData: any) {
    // 传递 tabData 至 query string（更通用）
    // 实际应用建议更安全的序列化方式，这里做简单处理
    const urlParam = encodeURIComponent(JSON.stringify(tabData))
    const tabWin = new BrowserWindow({
        width: 900,
        height: 670,
        show: false,
        autoHideMenuBar: true,
        frame: false,
        webPreferences: {
            preload: join(__dirname, '../preload/index.js'),
            sandbox: false,
            nodeIntegration: false
        }
    })
    tabWindows.add(tabWin) // 跟踪所有 tab 独立窗口

    tabWin.on('ready-to-show', () => {
        tabWin.show()
    })
    tabWin.on('closed', () => {
        tabWindows.delete(tabWin)
    })
    // 加载页面并传递参数
    if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
        tabWin.loadURL(process.env['ELECTRON_RENDERER_URL'] + `?detachedTab=${urlParam}`)
    } else {
        tabWin.loadFile(join(__dirname, '../renderer/index.html'), { search: `?detachedTab=${urlParam}` })
    }
}

function createWindow(): void {
    // Create the browser window.
    mainWindow = new BrowserWindow({
        width: 900,
        height: 670,
        show: false,
        autoHideMenuBar: true,
        frame: false,
        // titleBarStyle: 'hidden',
        ...(process.platform === 'linux' ? { icon } : {}),
        webPreferences: {
            preload: join(__dirname, '../preload/index.js'),
            sandbox: false
        }
    })

    // 最大化/还原状态查询
    ipcMain.handle('win:isMaximized', () => mainWindow?.isMaximized())

    // 窗口最大化/还原事件推送给渲染进程
    mainWindow.on('maximize', () => {
        mainWindow?.webContents.send('win:maximized')
    })
    mainWindow.on('unmaximize', () => {
        mainWindow?.webContents.send('win:unmaximized')
    })

    mainWindow!.on('ready-to-show', () => {
        mainWindow!.show()
    })

    mainWindow.webContents.setWindowOpenHandler((details) => {
        shell.openExternal(details.url)
        return { action: 'deny' }
    })

    // HMR for renderer base on electron-vite cli.
    // Load the remote URL for development or the local html file for production.
    if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
        mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
    } else {
        mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
    }
}

ipcMain.on('win:action', (event, action) => {
    // 让每个窗口都能独立控制自己
    const win = BrowserWindow.fromWebContents(event.sender)
    if (!win || win.isDestroyed()) return

    switch (action) {
        case 'min':
            win.minimize()
            break
        case 'max':
            win.isMaximized() ? win.restore() : win.maximize()
            break
        case 'close':
            win.close()
            break
    }
})

// --- 新增主进程事件监听 ---
ipcMain.on('tab:detach', (event, tabData) => {
    // 创建新 tab 独立窗口
    createTabWindow(tabData)
})


// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
    // Set app user model id for windows
    electronApp.setAppUserModelId('com.electron')

    // Default open or close DevTools by F12 in development
    // and ignore CommandOrControl + R in production.
    // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
    app.on('browser-window-created', (_, window) => {
        optimizer.watchWindowShortcuts(window)
    })

    // IPC test
    ipcMain.on('ping', () => console.log('pong'))

    createWindow()

    app.on('activate', function () {
        // On macOS it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
