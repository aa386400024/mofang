import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', {
    state: () => ({
        name: '',
        avatar: '',
        token: ''
    }),
    actions: {
        setUser(name: string, avatar: string) {
            this.name = name
            this.avatar = avatar
        }
    }
})