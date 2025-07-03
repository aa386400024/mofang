import { defineStore } from 'pinia'

export interface Tab {
    key: string
    title: string
    path: string
    icon?: any
    closable?: boolean
    cacheKey?: string
    query?: any
    params?: any
}

function newTab(path = '/ai-chat', title = 'AI 搜索或打开网页', key = '') {
    const tabKey = key || `${path}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    return {
        key: tabKey,
        title,
        path,       // 仍然是 '/ai-chat'
        query: { tabKey }, // 关键！给每个tab一个唯一query参数
        closable: true,
        cacheKey: tabKey,
    }
}

export const useTabsStore = defineStore('tabs', {
    state: () => ({
        tabs: [] as Tab[],      // 只管理可关闭tab
        activeKey: 'home',        // 'home', 'ai-chat', 或 chat tab key
    }),
    actions: {
        openTab({ path = '/ai-chat', title = 'AI 搜索或打开网页' }: { path?: string, title?: string } = {}) {
            const tab = newTab(path, title)
            this.tabs.push(tab)
            this.activeKey = tab.key
        },
        closeTab(key: string) {
            const idx = this.tabs.findIndex(t => t.key === key)
            if (idx !== -1) {
                this.tabs.splice(idx, 1)
                if (this.tabs.length === 0) {
                    this.activeKey = 'home'
                } else if (this.activeKey === key) {
                    this.activeKey = this.tabs[Math.max(idx - 1, 0)].key
                }
            }
        },
        setActive(key: string) {
            this.activeKey = key
        },
        reorderTab(from: number, to: number) {
            const t = this.tabs.splice(from, 1)[0]
            this.tabs.splice(to, 0, t)
        },
        resetTabs() {
            this.tabs = []
            this.activeKey = 'ai-chat'
        },
    }
})


