import { createRouter, createWebHashHistory } from 'vue-router'
import generatedRoutes from 'virtual:generated-pages'
import { setupRouterGuard } from './guards'

// 追加你的 redirect（手动加在自动生成 routes 前面即可）
const routes = [
    // { path: '/', redirect: '/home' },
    ...generatedRoutes
]

const router = createRouter({
    history: createWebHashHistory(),  // Electron推荐用hash
    routes
})

setupRouterGuard(router)

export default router