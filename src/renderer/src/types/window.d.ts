interface TabApi {
    getTabList: () => Promise<{ tabs: { id: number; url: string; title?: string; favicon?: string }[]; active: number }>
    newTab: (url: string) => Promise<any>
    switchTab: (id: number) => Promise<void>
    closeTab: (id: number) => Promise<any>
    gotoTabUrl: (id: number, url: string) => Promise<any>
    moveTab: (oldIndex: number, newIndex: number) => Promise<any>
    onTitleUpdated: (cb: (e: any, data: { id: number; title: string }) => void) => void
    onFaviconUpdated: (cb: (e: any, data: { id: number; favicon: string }) => void) => void
    onUrlUpdated: (cb: (e: any, data: { id: number; url: string }) => void) => void
    onActiveChanged: (cb: (e: any, activeTabId: number) => void) => void
    onOrderUpdated: (cb: (e: any) => void) => void
    showTabContextMenu: (tabMenuInfo: { id: number; url: string; title?: string; x: number; y: number; index: number; total: number }) => Promise<any>
    insertTabAfter: (afterTabId: number, url: string) => Promise<any>
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

interface Window {
    api: ApiInPreload;
}
