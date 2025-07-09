import { BrowserWindow, BrowserView, app } from 'electron'
import { join } from 'path'
import icon from '../../resources/icon.png?asset'
import { is } from '@electron-toolkit/utils'

export let mainWindow: BrowserWindow | null = null
export let tabWindows: Set<BrowserWindow> = new Set()
export let tabs: TabInfo[] = []
export let activeTabId: number = -1

let tabIdCounter = 1
const TOP_OFFSET = 88;
export function buildProtocolUrl(tab: TabInfo): string {
    if (tab.type === 'web' || tab.type === 'plugin') return tab.url || '';
    let propPart = '';
    if (tab.pageProps && Object.keys(tab.pageProps).length) {
        propPart = '?' + new URLSearchParams(tab.pageProps).toString();
    }
    return `myapp://${tab.type}/${tab.pageName || ''}${propPart}`;
}
export function getTabList() {
    return {
        tabs: tabs.map(tab => ({
            ...tab,
            protocolUrl: buildProtocolUrl(tab)
        })),
        active: activeTabId
    }
}
function getBrowserViewBounds(win: BrowserWindow) {
    const [width, height] = win.getContentSize()
    return { x: 0, y: TOP_OFFSET, width, height: height - TOP_OFFSET }
}
function updateActiveTabBounds() {
    if (!mainWindow || activeTabId === -1) return;
    const tab = tabs.find(t => t.id === activeTabId);
    if (!tab) return;
    if ((tab.type === 'web' || tab.type === 'plugin') && tab.view) {
        tab.view.setBounds(getBrowserViewBounds(mainWindow!))
    }
}

export function createWebTab(url: string = 'https://www.baidu.com'): TabInfo {
    const view = new BrowserView({
        webPreferences: {
            preload: join(__dirname, '../preload/index.js'),
            nodeIntegration: false,
            contextIsolation: true, // 建议true，已预设
            sandbox: false
        }
    })
    view.webContents.loadURL(url)

    // 监听事件更新title/favicon等
    view.webContents.on('page-title-updated', (e, title) => {
        const tab = tabs.find(t => t.view === view)
        if (tab) tab.title = title
        mainWindow?.webContents.send('tab:title-updated', { id: tab?.id, title })
    })
    view.webContents.on('page-favicon-updated', (e, favicons) => {
        const tab = tabs.find(t => t.view === view)
        if (tab) tab.favicon = favicons[0]
        mainWindow?.webContents.send('tab:favicon-updated', { id: tab?.id, favicon: favicons[0] })
    })
    // url导航事件，通知前端
    view.webContents.on('did-navigate', (e, url) => {
        const tab = tabs.find(t => t.view === view)
        if (tab) tab.url = url
        mainWindow?.webContents.send('tab:url-updated', { id: tab?.id, url })
    })

    const tab: TabInfo = { id: tabIdCounter++, type: 'web', url, view }
    return tab
}

export function createPluginTab(url: string): TabInfo {
    const view = new BrowserView({
        webPreferences: {
            preload: join(__dirname, '../preload/index.js'),
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: false
        }
    })
    view.webContents.loadURL(url)
    view.webContents.on('page-title-updated', (e, title) => {
        const tab = tabs.find(t => t.view === view)
        if (tab) {
            tab.title = title
            mainWindow?.webContents.send('tab:title-updated', { id: tab.id, title })
        }
    })
    view.webContents.on('page-favicon-updated', (e, favicons) => {
        const tab = tabs.find(t => t.view === view)
        if (tab) {
            tab.favicon = favicons[0]
            mainWindow?.webContents.send('tab:favicon-updated', { id: tab.id, favicon: favicons[0] })
        }
    })
    view.webContents.on('did-navigate', (e, url) => {
        const tab = tabs.find(t => t.view === view)
        if (tab) {
            tab.url = url
            mainWindow?.webContents.send('tab:url-updated', { id: tab.id, url })
        }
    })
    return {
        id: tabIdCounter++,
        type: 'plugin',
        url,
        view
    }
}

export function createLocalTab(type: 'local-page' | 'console', pageName: string, pageProps?: any): TabInfo {
    return {
        id: tabIdCounter++,
        type,
        pageName,
        pageProps,
        title: pageProps?.title,
    }
}

export function setActiveTab(tabId: number) {
    if (!mainWindow) return
    const tab = tabs.find(t => t.id === tabId)
    if (!tab) return
    // 移除所有View
    tabs.forEach(t => {
        if ((t.type === 'web' || t.type === 'plugin') && t.view) {
            try { mainWindow!.removeBrowserView(t.view) } catch (error) { }
        }
    })

    if ((tab.type === 'web' || tab.type === 'plugin') && tab.view) {
        mainWindow.addBrowserView(tab.view)
        tab.view.setBounds(getBrowserViewBounds(mainWindow))
    }
    activeTabId = tabId

    // 通知Tab切换
    mainWindow.webContents.send('tab:active-changed', tabId)
}

export function closeTab(tabId: number) {
    const idx = tabs.findIndex(t => t.id === tabId)
    if (idx === -1) return
    const [removed] = tabs.splice(idx, 1)
    // 如果是web/plugin类型，销毁BrowserView
    if ((removed.type === 'web' || removed.type === 'plugin') && removed.view) {
        try { mainWindow!.removeBrowserView(removed.view) } catch { }
        const wc = removed.view.webContents as any
        if (wc && wc.destroy) wc.destroy()
    }
    // 切换到前一Tab或空
    if (tabs.length) {
        const newIdx = Math.max(0, idx - 1)
        setActiveTab(tabs[newIdx].id)
    } else {
        activeTabId = -1
    }
}

// 按索引移动tab位置
export function moveTab(oldIndex: number, newIndex: number) {
    if (oldIndex === newIndex) return;
    if (
        oldIndex < 0 || oldIndex >= tabs.length ||
        newIndex < 0 || newIndex >= tabs.length
    ) return;
    const [item] = tabs.splice(oldIndex, 1);
    tabs.splice(newIndex, 0, item);
    // 保持当前tab不变，可以再发送事件出去，让renderer刷新
    if (mainWindow) {
        mainWindow.webContents.send('tab:order-updated');
    }
}

export function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1100,
        height: 750,
        show: false,
        autoHideMenuBar: true,
        frame: false,
        webPreferences: {
            preload: join(__dirname, '../preload/index.js'),
            contextIsolation: true,
            nodeIntegration: false,
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
    // 自动调整BrowserView尺寸
    mainWindow.on('resize', updateActiveTabBounds);
    mainWindow.on('enter-full-screen', updateActiveTabBounds);
    mainWindow.on('leave-full-screen', updateActiveTabBounds);
    mainWindow.on('maximize', updateActiveTabBounds);
    mainWindow.on('unmaximize', updateActiveTabBounds);

    // 默认初始tab（任选），一web、一local-page、一console、一plugin
    tabs.push(createWebTab('https://www.baidu.com'))
    tabs.push(createLocalTab('local-page', 'dashboard', { title: '首页' }))
    tabs.push(createLocalTab('console', 'console', { title: '管理控制台', welcome: 'hello from Console' }))
    tabs.push(createPluginTab('https://unpkg.com')) // 示例plugin页
    setActiveTab(tabs[0].id)
}