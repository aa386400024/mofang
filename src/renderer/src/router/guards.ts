import type { Router } from 'vue-router'

/**
 * 给路由增加全局守卫
 * @param router - vue-router 实例
 */
export function setupRouterGuard(router: Router) {
    // 1. 路由前置守卫
    router.beforeEach((to, from, next) => {
        next()
        console.log('路由前置守卫', to.matched.map(r => r.path))        // 示例: 需要登录的页面判断
        // const isLogin = localStorage.getItem('token') // 你自己的鉴权逻辑
        // if (to.meta.requiresAuth && !isLogin) {
        //     next({ path: '/login', query: { redirect: to.fullPath } })
        // } else {
        //     next()
        // }
    })

    // 2. 其它守卫可以加在这里，如 afterEach
    // router.afterEach((to, from) => { ... });
}


