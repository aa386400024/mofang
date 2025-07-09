// stores/aiChatTabs.ts

import { defineStore } from 'pinia'

export const useAiChatTabsStore = defineStore('chat', {
    state: () => ({
        tabStates: {} as Record<string, { input: string; count: number, createdAt: string }>
    }),
    actions: {
        getTab(tabKey: string) {
            if (!this.tabStates[tabKey]) this.tabStates[tabKey] = { input: '', count: 0, createdAt: new Date().toLocaleString() }
            return this.tabStates[tabKey]
        },
        setInput(tabKey: string, value: string) {
            this.getTab(tabKey).input = value
        },
        setCount(tabKey: string, value: number) {
            this.getTab(tabKey).count = value
        }
    }
})
