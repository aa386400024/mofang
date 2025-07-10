export type InsertTabInfo =
    | { type: 'web'; url: string }
    | { type: 'plugin'; url: string }
    | { type: 'local-page'; pageName: string; pageProps?: any }
    | { type: 'console'; pageName: string; pageProps?: any }

interface TabApi {
    getTabList: () => Promise<{ tabs: TabListItem[]; active: number }>;
    newTab: (url: string) => Promise<any>
    newLocalTab: (pageName: string, pageProps?: any) => Promise<any>
    newPluginTab: (url: string) => Promise<any>
    switchTab: (id: number) => Promise<void>
    closeTab: (id: number) => Promise<any>
    gotoTabUrl: (id: number, url: string) => Promise<any>
    moveTab: (oldIndex: number, newIndex: number) => Promise<any>
    replaceTab: (tabId: number, info: InsertTabInfo) => Promise<any>;
    setInputDraft: (tabId: number, draft: string) => Promise<void>;
    onTitleUpdated: (cb: (e: any, data: { id: number; title: string }) => void) => void
    onFaviconUpdated: (cb: (e: any, data: { id: number; favicon: string }) => void) => void
    onUrlUpdated: (cb: (e: any, data: { id: number; url: string }) => void) => void
    onActiveChanged: (cb: (e: any, activeTabId: number) => void) => void
    onOrderUpdated: (cb: (e: any) => void) => void
    showTabContextMenu: (tabMenuInfo: { id: number; url: string; title?: string; x: number; y: number; index: number; total: number }) => Promise<any>
    insertTabAfter: (afterTabId: number, info: InsertTabInfo) => Promise<any>
    tabMenuAction: (cb: (e: any, data: { type: string; tab: any }) => void) => void
    offTabMenuAction: (cb: (e: any, data: { type: string; tab: any }) => void) => void
}

interface ApiInPreload {
    win: (action: 'min' | 'max' | 'close') => void;
    isMaximized?: () => Promise<boolean>;
    onMaximize?: (cb: () => void) => void;
    onUnmaximize?: (cb: () => void) => void;
    detachTab: (tab: any) => void;
    clipboard: {
        writeText: (text: string) => void
        readText: () => string
    }
    tab: TabApi;
    // 以后可以继续扩展其他预加载api

}

declare global {
    type TabType = 'web' | 'local-page' | 'console' | 'plugin'
    interface TabListItem {
        id: number;
        type: TabType;
        url?: string;
        title?: string;
        favicon?: string;  
        pageName?: string;  
        pageProps?: any;    
        protocolUrl: string; // 协议url
        inputDraft?: string; // 输入框的缓存
        history?: string[]
        currentHistoryIndex?: number
    }
    interface Window {
        api: ApiInPreload;

    }
}
