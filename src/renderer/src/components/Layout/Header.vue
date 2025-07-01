<template>
    <header class="flex items-center h-10 w-full select-none border-b-0 bg-[#e5e5e5]" style="-webkit-app-region: drag">
        <div class="flex items-center h-full flex-1 min-w-0 overflow-hidden pr-16">
            <ProTabs :tabs="displayTabs" :model-value="activeKey" :hideAdd="hideAdd" :showHome="true"
                @tab-add="onTabAdd" @tab-close="onTabClose" @tab-dragend="onTabDrag" @update:modelValue="onTabChange" />
        </div>
        <div class="flex items-center gap-2 ml-2 no-drag" v-no-contextmenu>
            <WinBtn icon="minus" @click="windowControl('min')" />
            <WinBtn :icon="isMaximized ? 'restore' : 'square'" @click="windowControl('max')" />
            <WinBtn icon="close" @click="windowControl('close')" />
        </div>
    </header>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, watch, onBeforeUnmount } from 'vue'
import { storeToRefs } from 'pinia'
import { useTabsStore } from '@renderer/store/tabs'
import { ProTabs } from '../pro-ui'
import { WinBtn } from './index'
import { PlusOutlined } from '@ant-design/icons-vue'
import { useRouter } from 'vue-router'
 
const tabsStore = useTabsStore()
const router = useRouter()
const { tabs, activeKey } = storeToRefs(tabsStore)

// 是否只剩home（默认home在ProTabs内部写死，不进tabs，只剩ai时tabs.length == 0）
const showAiTab = computed(() => tabs.value.length === 0)
const aiTab = computed(() => ({
    key: 'ai-chat',
    title: 'AI 搜索或打开网页',
    path: '/ai-chat',
    icon: PlusOutlined,
    closable: false,                // 入口态不可关闭
    cacheKey: 'ai-chat'
}))
const displayTabs = computed(() => (
    showAiTab.value ? [aiTab.value] : tabs.value
))
// 只剩home和ai入口时隐藏+号
const hideAdd = computed(() => tabs.value.length === 0)

const onTabAdd = () => tabsStore.openTab({ path: '/ai-chat', title: '新标签页' })

const onTabClose = (tab) => tabsStore.closeTab(tab.key)

const onTabChange = (key) => {
    // 点击AI入口，生成新tab并激活
    if (key === 'ai-chat') {
        tabsStore.openTab({ path: '/ai-chat', title: '新标签页' })
    } else {
        tabsStore.setActive(key)
    }
}

const onTabDrag = (from, to) => tabsStore.reorderTab(from, to)

const isMaximized = ref(false)
const windowControl = (action: 'min' | 'max' | 'close') => {
    window.api?.win?.(action)
}

watch(
    () => tabsStore.activeKey,
    key => {
        const tab = tabs.value.find(t => t.key === key);
        if (tab && tab.path) {
            // 路由对象需完整，path不能为空
            const location = {
                path: tab.path,
                query: tab.query ?? {},
                params: tab.params ?? {},
            };
            // 防守性，不能有 undefined
            if (
                typeof location.path === 'string' &&
                location.path.trim() !== ''
            ) {
                router.replace(location);
                return;
            }
        }
        // ai-chat 特殊入口
        if (key === 'ai-chat') {
            console.log('[tabwatch] 跳转 ai-chat');
            router.replace('/ai-chat');
            return;
        }
        if (key === 'home') {
            console.log('[tabwatch] 跳转 home');
            router.replace('/');
            return;
        }
        // fallback: 不做跳转
        console.warn('[tabwatch] activeKey未对应任何tab或入口，什么都不跳。', key, tabs.value);
    },
    { immediate: true }
)

/**
 * 处理标签菜单操作
 * @param {any} _event - 事件对象
 * @param {any} actionInfo - 操作信息，包含操作类型和相关标签信息
 */
const handleTabMenuAction = (_event: any, actionInfo: any) => {
    switch (actionInfo.type) {
        case 'close':
            // 关闭当前标签
            tabsStore.closeTab(actionInfo.tab.key)
            break

        case 'closeRight': {
            // 关闭右侧所有tab
            const idx = tabsStore.tabs.findIndex(t => t.key === actionInfo.tab.key)
            if (idx !== -1) {
                // 只保留idx及其左边
                const toBeClosed = tabsStore.tabs.slice(idx + 1).map(t => t.key)
                toBeClosed.forEach(k => tabsStore.closeTab(k))
            }
            break
        }

        case 'closeOthers': {
            // 关闭除自己以外所有tab
            const toBeClosed = tabsStore.tabs.filter(t => t.key !== actionInfo.tab.key).map(t => t.key)
            toBeClosed.forEach(k => tabsStore.closeTab(k))
            break
        }

        case 'reload':
            // 除非你tab有reload逻辑，否则通常需要emit到tab内容组件去做
            // 可存储reloadKey等强制刷新内容
            // 或用事件上抛（这里举例，不实现具体业务）
            break

        case 'copy':
            // 复制tab标题或URL
            if (window.api?.clipboard && actionInfo.tab) {
                window.api.clipboard.writeText(actionInfo.tab.title + ' ' + actionInfo.tab.path)
            }
            break

        case 'pin':
            // 你可以给tab添加pinned属性，或者自行实现
            // tabsStore.pinTab(actionInfo.tab.key)
            break

        case 'newRight':
            // 在右侧新建tab
            {
                const idx = tabsStore.tabs.findIndex(t => t.key === actionInfo.tab.key)
                const newTabObj = {
                    path: '/ai-chat',
                    title: '新标签页'
                }
                // 插入到指定位置的右侧
                const oldLen = tabsStore.tabs.length
                tabsStore.openTab(newTabObj)
                // 重新排列新tab在右侧
                const lastTab = tabsStore.tabs.pop()
                if (lastTab && idx !== -1) {
                    tabsStore.tabs.splice(idx + 1, 0, lastTab)
                    tabsStore.activeKey = lastTab.key
                }
            }
            break
        default:
            // 其它自定义
            break
    }
}

onMounted(() => {
    window.electron?.ipcRenderer?.on('tab-menu-action', handleTabMenuAction)
    window.api?.onMaximize?.(() => (isMaximized.value = true))
    window.api?.onUnmaximize?.(() => (isMaximized.value = false))
    window.api?.isMaximized?.().then(res => (isMaximized.value = !!res))
})

onBeforeUnmount(() => {
    (window.electron?.ipcRenderer as any)?.off('tab-menu-action', handleTabMenuAction)
})
</script>

<style scoped lang="scss">
.no-drag {
    -webkit-app-region: no-drag;
}
</style>