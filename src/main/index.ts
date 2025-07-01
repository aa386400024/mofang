import { app, shell, BrowserWindow, ipcMain, Menu, MenuItem } from 'electron'
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

    // ---- 右键菜单实现 开始 ----
    mainWindow.webContents.on('context-menu', (event, params) => {
        // params 可以识别是在输入框、链接还是页面空白等
        const { isEditable } = params
        const { Menu, MenuItem } = require('electron')
        const menu = new Menu()
        // 只在页面空白区域弹出浏览器风格菜单
        if (!isEditable) {
            // 返回
            menu.append(new MenuItem({
                label: '返回',
                accelerator: 'Alt+Left',
                click: () => mainWindow?.webContents.navigationHistory.goBack(),
                enabled: mainWindow?.webContents.navigationHistory.canGoBack() ?? false
            }))
            // 前进
            menu.append(new MenuItem({
                label: '前进',
                accelerator: 'Alt+Right',
                click: () => mainWindow?.webContents.navigationHistory.goForward(),
                enabled: mainWindow?.webContents.navigationHistory.canGoForward() ?? false
            }))
            menu.append(new MenuItem({ type: 'separator' }))
            // 重新加载
            menu.append(new MenuItem({
                label: '重新加载',
                accelerator: 'Ctrl+R',
                click: () => mainWindow?.webContents.reload()
            }))
            // 另存为
            menu.append(new MenuItem({
                label: '另存为...',
                accelerator: 'Ctrl+S',
                click: () => mainWindow?.webContents.savePage('page.html', 'HTMLComplete') // 你可以完善处理
            }))
            // 打印
            menu.append(new MenuItem({
                label: '打印...',
                accelerator: 'Ctrl+P',
                click: () => mainWindow?.webContents.print()
            }))
            menu.append(new MenuItem({ type: 'separator' }))
            // 检查源码
            menu.append(new MenuItem({
                label: '查看网页源码',
                accelerator: 'Ctrl+U',
                click: () => mainWindow?.webContents.send('view-source')
            }))
            menu.append(new MenuItem({
                label: '检 查',
                click: () => mainWindow?.webContents.openDevTools({ mode: 'undocked' })
            }))
            menu.popup({ window: mainWindow! })
        } else {
            // 输入框/可编辑区的自定义菜单
            // 剪切
            menu.append(new MenuItem({
                label: '剪切',
                role: 'cut', // 用role自动调用剪切
                accelerator: 'Ctrl+X',
                enabled: params.editFlags.canCut,
            }));
            // 复制
            menu.append(new MenuItem({
                label: '复制',
                role: 'copy',
                accelerator: 'Ctrl+C',
                enabled: params.editFlags.canCopy,
            }));
            // 粘贴
            menu.append(new MenuItem({
                label: '粘贴',
                role: 'paste',
                accelerator: 'Ctrl+V',
                enabled: params.editFlags.canPaste,
            }));
            // 粘贴并搜索（演示粘贴然后自动搜索，可以自定义功能）
            menu.append(new MenuItem({
                label: '粘贴并搜索',
                click: (_menuItem, browserWindow, _event) => {
                    if (browserWindow) {
                        browserWindow.webContents.paste();
                        // 这里可以发给前端一个事件，让前端拿当前input value并自动搜索
                        browserWindow.webContents.send('input-paste-search', params);
                    }

                },
                enabled: params.editFlags.canPaste,
            }));
            // 删除
            menu.append(new MenuItem({
                label: '删除',
                role: 'delete',
                accelerator: 'Del',
                enabled: params.editFlags.canDelete,
            }));
            // 辅助分割线
            menu.append(new MenuItem({ type: 'separator' }));
            // 全选
            menu.append(new MenuItem({
                label: '全选',
                role: 'selectAll',
                accelerator: 'Ctrl+A',
                enabled: params.editFlags.canSelectAll,
            }));
            // 其它自定义项
            menu.append(new MenuItem({ type: 'separator' }));
            menu.append(new MenuItem({
                label: '管理搜索引擎和网站搜索',
                click: (menuItem, browserWindow, _event) => {
                    if (browserWindow) {
                        // 你的自定义逻辑
                        browserWindow.webContents.send('open-search-setting');
                    }
                }
            }));
            menu.append(new MenuItem({
                label: '总是显示完整网址',
                click: (menuItem, browserWindow, _event) => {
                    if (browserWindow) {
                        browserWindow.webContents.send('always-show-full-url');
                    }
                }
            }));
            menu.popup({ window: mainWindow! });
            return; // 阻止系统原生菜单
        }
    })

    // 监听 tab 区域右键菜单调用
    ipcMain.handle('show-tab-context-menu', (event, tabMenuInfo) => {
        const win = BrowserWindow.fromWebContents(event.sender)
        if (!win || win.isDestroyed()) return
        const menu = new Menu()
        // Tab专用菜单
        menu.append(new MenuItem({
            label: '在右侧新建标签页',
            click: () => win.webContents.send('tab-menu-action', { type: 'newRight', tab: tabMenuInfo })
        }))
        menu.append(new MenuItem({
            label: '重新加载',
            accelerator: 'Ctrl+R',
            click: () => win.webContents.send('tab-menu-action', { type: 'reload', tab: tabMenuInfo })
        }))
        menu.append(new MenuItem({
            label: '复制',
            click: () => win.webContents.send('tab-menu-action', { type: 'copy', tab: tabMenuInfo })
        }))
        menu.append(new MenuItem({ type: 'separator' }))
        menu.append(new MenuItem({
            label: '关闭',
            accelerator: 'Ctrl+W',
            click: () => win.webContents.send('tab-menu-action', { type: 'close', tab: tabMenuInfo })
        }))
        menu.append(new MenuItem({
            label: '关闭右侧标签页',
            click: () => win.webContents.send('tab-menu-action', { type: 'closeRight', tab: tabMenuInfo })
        }))
        // 可以继续append别的项
        // menu.popup 指定坐标（x, y）：需要用 { x, y, window } 方式
        menu.popup({ window: win, x: tabMenuInfo.x, y: tabMenuInfo.y })
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
