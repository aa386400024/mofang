import { BrowserWindow } from 'electron'

declare global {
    var userPopupWin: BrowserWindow | null | undefined
    type TabType = 'web' | 'local-page' | 'console' | 'plugin'

    type InsertTabInfo =
        | { type: 'web'; url: string }
        | { type: 'plugin'; url: string }
        | { type: 'local-page'; pageName: string; pageProps?: any }
        | { type: 'console'; pageName: string; pageProps?: any }

    type TabHistoryEntry = {
        type: TabType
        url?: string        // web 页
        pageName?: string   // local/page/console
        pageProps?: any     // 业务自定义
        title?: string      // 页面标题
        favicon?: string    // web 页 favicon
        // 你还可扩展更多，比如跳转来源等
    }

    type TabInfo = {
        id: number
        type: TabType
        url?: string
        title?: string
        favicon?: string
        view?: BrowserView
        history: TabHistoryEntry[]
        currentHistoryIndex: number
        pageName?: string // local-page/console等类型时：vue页面名
        pageProps?: Record<string, any> // 传递到页面的参数数据
        protocolUrl?: string // 插件类型时：插件协议地址
        inputDraft?: string // 输入框的缓存数据
        isHistoryJump?: boolean
    }
}