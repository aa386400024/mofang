import { defineStore } from 'pinia'
import type { Message } from '@renderer/types'

export const useChatStore = defineStore('chat', {
    state: () => ({
        sessionId: '',
        messages: [] as Message[]
    }),
    actions: {
        addMessage(msg: Message) {
            this.messages.push(msg)
        }
    }
})