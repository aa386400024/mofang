<template>
    <header class="flex items-center h-10 w-full select-none border-b-0 bg-[#e5e5e5]" style="-webkit-app-region: drag">
        <!-- Tabs部分 -->
        <div class="flex items-center h-full flex-1 min-w-0 overflow-hidden pr-16">
            <ProTabs 
                :tabs="tabs" 
                v-model="activeTab" 
                :hideAdd="hideAdd" 
                :showHome="showHome" 
                @tab-add="addTab"
                @tab-close="removeTab" 
                @tab-dragend="onTabDrag" 
                @update:modelValue="handleTabChange" 
            />
        </div>
        <!-- 右侧窗口按钮 -->
        <div class="flex items-center gap-2 ml-2 no-drag">
            <WinBtn icon="minus" @click="windowControl('min')" />
            <WinBtn :icon="isMaximized ? 'restore' : 'square'" @click="windowControl('max')" />
            <WinBtn icon="close" @click="windowControl('close')" />
        </div>
    </header>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { WinBtn } from './index'
import { ProTabs, type ProTabItem } from '../pro-ui'
import { HomeFilled, FileOutlined, PlusOutlined } from '@ant-design/icons-vue'

const AI_TAB: ProTabItem = {
    title: 'AI 搜索或打开网页', key: 'ai', icon: PlusOutlined, closable: false
}

function getDetachedTabsFromUrl(): ProTabItem[] | null {
    // 用 tabs（数组）参数更灵活，有多个时都能带出去
    try {
        const m = /detachedTabs=([^&]+)/.exec(window.location.search)
        if (m) {
            return JSON.parse(decodeURIComponent(m[1]))
        }
    } catch (e) { }
    return null
}

const detachedTabs = getDetachedTabsFromUrl()
const isSubWindow = !!detachedTabs

// 拆分窗口的 tabs/activeTab只初始化一次并独立于主窗口，主窗口正常
const tabs = ref<ProTabItem[]>(
    isSubWindow
        ? (detachedTabs || []).filter((tab) => tab.key !== AI_TAB.key)
        : [{ ...AI_TAB }]
)

const activeTab = ref(isSubWindow
    ? ((detachedTabs && detachedTabs[0]?.key) || '')
    : 'ai'
)

const showHome = computed(() => !isSubWindow) // 主窗口才显示 home
const hideAdd = computed(() =>
    tabs.value.length === 0
    || (tabs.value.length === 1 && tabs.value[0].key === 'ai')
)

const handleTabChange = (key: string) => {
    // 只剩 AI_TAB 时点首页就变成新tab
    if (key === 'ai' && tabs.value.length === 1 && tabs.value[0].key === 'ai') {
        const newTab = {
            title: '新标签页',
            key: `tab_${Date.now()}`,
            icon: FileOutlined,
            closable: true
        }
        tabs.value = [newTab]
        activeTab.value = newTab.key
    } else {
        activeTab.value = key
    }
}
const addTab = () => {
    const newTab = {
        title: '新标签页', key: `tab_${Date.now()}`, icon: FileOutlined, closable: true
    }
    tabs.value.push(newTab)
    activeTab.value = newTab.key
}
const removeTab = (tab: ProTabItem, idx: number) => {
    tabs.value.splice(idx, 1)
    if (tabs.value.length === 0) {
        if (isSubWindow) {
            window.api?.win?.('close')
        } else {
            tabs.value = [{ ...AI_TAB }]
            activeTab.value = 'ai'
        }
    } else if (activeTab.value === tab.key) {
        activeTab.value = tabs.value[Math.max(idx - 1, 0)].key
    }
}
const onTabDrag = (from, to) => {
    const moved = tabs.value.splice(from, 1)[0]
    tabs.value.splice(to, 0, moved)
}
const windowControl = (action: 'min' | 'max' | 'close') => {
    window.api?.win?.(action)
}

const isMaximized = ref(false)
onMounted(() => {
    window.api?.onMaximize?.(() => (isMaximized.value = true))
    window.api?.onUnmaximize?.(() => (isMaximized.value = false))
    window.api?.isMaximized?.().then(res => (isMaximized.value = !!res))
})
</script>
<style scoped lang="scss">
.no-drag {
    -webkit-app-region: no-drag;
}
</style>
