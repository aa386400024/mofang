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
    // 以后可以继续扩展其他预加载api
}

interface Window {
    api: ApiInPreload;
}