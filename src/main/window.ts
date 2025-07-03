import { BrowserWindow } from 'electron'
import { join } from 'path'
import icon from '../../resources/icon.png?asset'
import { is } from '@electron-toolkit/utils'

export let mainWindow: BrowserWindow | null = null
export let tabWindows: Set<BrowserWindow> = new Set()

export function createTabWindow(tabData: any) {
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
            nodeIntegration: false,
        },
        ...(process.platform === 'linux' ? { icon } : {}),
    })
    tabWindows.add(tabWin)
    tabWin.on('ready-to-show', () => tabWin.show())
    tabWin.on('closed', () => tabWindows.delete(tabWin))
    if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
        tabWin.loadURL(process.env['ELECTRON_RENDERER_URL'] + `?detachedTab=${urlParam}`)
    } else {
        tabWin.loadFile(join(__dirname, '../renderer/index.html'), { search: `?detachedTab=${urlParam}` })
    }
}

export function createWindow() {
    mainWindow = new BrowserWindow({
        width: 900,
        height: 670,
        show: false,
        autoHideMenuBar: true,
        frame: false,
        webPreferences: {
            preload: join(__dirname, '../preload/index.js'),
            sandbox: false
        },
        ...(process.platform === 'linux' ? { icon } : {}),
    })
    mainWindow.on('ready-to-show', () => mainWindow!.show())
    mainWindow.webContents.setWindowOpenHandler((details) => {
        require('electron').shell.openExternal(details.url)
        return { action: 'deny' }
    })
    if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
        mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
    } else {
        mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
    }
}