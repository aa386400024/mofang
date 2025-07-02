import { app, shell, BrowserWindow } from 'electron'
import { electronApp, optimizer } from '@electron-toolkit/utils'
import { createWindow, mainWindow, tabWindows } from './window'
import { setupMainContextMenu } from './menu'
import { setupIpcHandlers } from './ipc'

app.whenReady().then(() => {
    electronApp.setAppUserModelId('com.electron')
    app.on('browser-window-created', (_, window) => {
        optimizer.watchWindowShortcuts(window)
    })
    createWindow()
    if (mainWindow) {
        setupMainContextMenu(mainWindow)
        setupIpcHandlers(mainWindow, tabWindows)
    }
    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
})