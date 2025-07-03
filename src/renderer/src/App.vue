<template>
    <Layout v-if="!isPurePopupPage" />
    <!-- 只渲染弹窗本身内容 -->
    <router-view v-else />
</template>

<script setup lang="ts">
import { computed, onMounted, watchEffect } from 'vue'
import { Layout } from '@renderer/components/Layout'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

// 可以集中管理所有弹窗（纯净页）前缀，易扩展
const PURE_POPUP_PREFIXES = [
    '/user-popup',
    '/about-popup',
    '/settings-popup',
    // 以后还可以 /popup/xxx 形式
]

const isPopupRoute = (path) => {
    // 支持完全匹配和前缀匹配
    return PURE_POPUP_PREFIXES.some(prefix => path === prefix || path.startsWith(prefix + '/'))
}

const isPurePopupPage = computed(() => isPopupRoute(route.path))

// dev下若 hash 丢失，每次弹窗初始化都兜底跳过去
onMounted(() => {
    const realPath = PURE_POPUP_PREFIXES.find(prefix => window.location.hash.includes(prefix))
    if (
        realPath &&                                // 先确保 realPath 一定有值
        PURE_POPUP_PREFIXES.some(prefix => window.location.hash.includes(prefix)) &&
        !isPopupRoute(route.path)
    ) {
        window.location.hash = `#${realPath}`
        router.replace(realPath)
    }
})

// 调试：弹窗/主窗都能看到实际路由
watchEffect(() => {
    console.log('<<<< App.vue: route.path:', route.path)
})
</script>