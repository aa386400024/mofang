<template>
    <!-- 没有tab时 -->
    <template v-if="!current">
        <div class="w-full h-full flex items-center justify-center text-[red] text-xl">
            请选择标签页
        </div>
    </template>

    <!-- 本地页（local-page console）做keep-alive但外层强key保证切换安全 -->
    <template v-else-if="current.type === 'local-page' || current.type === 'console'">
        <component
            :is="DynamicComponent"
            v-bind="current.pageProps"
            :key="current.type + '-' + current.pageName + '-' + current.id"
        />
    </template>

    <!-- 纯web/plugin页直接div空占位（BrowserView覆盖即可），或true动态内容需求用component展示 -->
    <template v-else>
        <div class="w-full h-full"></div>
    </template>
</template>

<script setup lang="ts">
import { defineAsyncComponent, h, computed, shallowRef, watchEffect } from 'vue'

// 支持自定义注册页面映射
const pageMap = {
    // 页名: 组件import  必须唯一。可按实际组件名写。
    dashboard: () => import('@renderer/views/home/index.vue'),
    about: () => import('@renderer/views/about/index.vue'),
    settings: () => import('@renderer/views/settings/index.vue'),
    aiChat: () => import('@renderer/views/ai-chat/index.vue'),
    // 更多业务页
    console: () => import('@renderer/views/my-console/index.vue')
}

// props: tabs数据 + 当前active tab id
const props = defineProps<{
    tabs: any[]
    activeTab: number
}>()

const current = computed(() => props.tabs.find((t) => t.id === props.activeTab))

// 动态加载组件
const DynamicComponent = shallowRef()

watchEffect(async () => {
    // 只处理local-page类型（主进程已保证）
    if (current.value && current.value.type === 'local-page' && current.value.pageName) {
        const loader = pageMap[current.value.pageName]
        DynamicComponent.value = loader ? defineAsyncComponent(loader) : null
    } else {
        DynamicComponent.value = null
    }
})
</script>
