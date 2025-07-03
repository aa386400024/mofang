<template>
    <!-- 弹窗 -->
    <ProPopup
        ref="mainPopupRef"
        :visible="userMenuVisible"
        :anchor-el="dropdownRef"
        placement="bottom-end"
        :offset-x="0"
        :offset-y="6"
        width="300px"
        radius="rounded-md"
        @close="closeUserMenu"
    >
        <pro-option-select
            v-model="currentSelectValue"
            :options="optionsList"
            :popup-ref="mainPopupRef?.popupRef"
            @select="handleMenuSelect"
        ></pro-option-select>
    </ProPopup>
    <header
        class="flex items-center h-10 w-full select-none border-b-0 bg-[#e5e5e5]"
        style="-webkit-app-region: drag"
    >
        <div class="flex items-center h-full flex-1 min-w-0 overflow-hidden pr-16">
            <ProTabs
                :tabs="displayTabs"
                :model-value="activeKey"
                :hideAdd="hideAdd"
                :showHome="true"
                @tab-add="onTabAdd"
                @tab-close="onTabClose"
                @tab-dragend="onTabDrag"
                @update:modelValue="onTabChange"
            />
        </div>
        <div class="flex items-center gap-2 ml-2 no-drag" v-no-contextmenu>
            <div
                ref="dropdownRef"
                class="flex items-center bg-gray-300 rounded-full px-1.5 py-1 h-[30px] cursor-pointer gap-1"
                @click="openUserMenu"
            >
                <!-- 使用 a-avatar 替换 img -->
                <a-avatar
                    :size="20"
                    :src="avatar"
                    class="!bg-white"
                    :style="{ minWidth: '20px' }"
                />
                <!-- 箭头旋转动画 -->
                <CaretDownFilled
                    class="text-gray-600 arrow-transition"
                    style="font-size: 12px"
                    :class="{ open: userMenuVisible }"
                />
            </div>
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
import { ProTabs, ProPopup, ProOptionSelect } from '../pro-ui'
import { WinBtn } from './index'
import { PlusOutlined, CaretUpFilled, CaretDownFilled } from '@ant-design/icons-vue'
import { useRouter } from 'vue-router'
import avatar from '@renderer/assets/img/avatar.png'

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
    closable: false, // 入口态不可关闭
    cacheKey: 'ai-chat'
}))

const userMenuVisible = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)
const mainPopupRef = ref<HTMLElement | null>(null)
console.log(mainPopupRef, 'mainPopupRef')

const currentSelectValue = ref()
const optionsList = [
    {
        title: '基本操作',
        showTitle: false, // 不显示分组名
        showDivider: true,
        options: [
            { value: 'set', label: '设置', icon: 'UserOutlined' },
            { value: 'b', label: '检查更新', icon: 'UserOutlined', desc: '当前版本：1.0.0' },
            { value: 'new', label: '新手引导', icon: 'UserOutlined' },
            { value: 'help', label: '帮助与反馈', icon: 'UserOutlined' }
        ]
    },
    {
        title: '标签',
        showTitle: false, // 不显示分组名
        showDivider: true,
        options: [
            { value: 'open', label: '打开新标签页', icon: 'UserOutlined', desc: 'Ctrl+T' },
            { value: 'window', label: '打开新窗口', icon: 'UserOutlined', desc: 'Ctrl+N' },
            { value: 'n', label: '打开新的无痕窗口', icon: 'UserOutlined', desc: 'Ctrl+Shift+N' },
        ]
    },
    {
        title: '设置',
        showTitle: false,
        showDivider: false,
        options: [
            {
                value: 'password',
                label: '密码和自动填充',
                icon: 'UserOutlined',
                children: [
                    {
                        title: '常用',
                        options: [
                            { value: 'password-and-utils', label: '密码和管理工具', icon: 'UserOutlined' },
                            { value: 'address-and-other-info', label: '地址和其他信息', icon: 'UserOutlined' },
                        ]
                    },
                    {
                        title: '其他',
                        showTitle: false, // 不显示次级组名
                        showDivider: false,
                        options: [{ value: 'b3', label: 'B3' }]
                    }
                ]
            },
            { value: 'history', label: '历史记录', icon: 'UserOutlined', desc: 'Ctrl+H' },
            { value: 'download', label: '下载内容', icon: 'UserOutlined', desc: 'Ctrl+J' },
            {
                value: 'bookmarks',
                label: '书签',
                icon: 'UserOutlined',
                children: [
                    {
                        showDivider: true,
                        options: [
                            { value: 'for-this-page-add-bookmark', label: '为此标签页添加标签...', icon: 'UserOutlined', desc: 'Ctrl+D' },
                            { value: 'for-all-page-add-bookmark', label: '为所有标签页添加标签...', icon: 'UserOutlined' },
                        ]
                    },
                    {
                        showDivider: true,
                        options: [
                            { value: 'hide-bookmark', label: '隐藏书签栏', icon: 'UserOutlined', desc: 'Ctrl+Shift+B' },
                            { value: 'show-bookmark', label: '显示所有书签', icon: 'UserOutlined', desc: 'Ctrl+Shift+B' },
                            { value: 'bookmark-management', label: '书签管理器', icon: 'UserOutlined', desc: 'Ctrl+Shift+O' },
                            { value: 'import-bookmark-and-set', label: '导入书签和设置...', icon: 'UserOutlined' },
                        ]
                    },
                    {
                        title: '书签',
                        showTitle: true,
                        showDivider: true,
                        options: [
                            { value: 'zhihu', label: '知乎' },
                            { value: 'douyin', label: '抖音' },
                            { value: 'potato', label: '番茄' },
                        ]
                    }
                ]
            },
            {
                value: 'extension-program',
                label: '扩展程序',
                icon: 'UserOutlined',
                children: [
                    {
                        options: [
                            { value: 'management-extension-program', label: '管理拓展程序', icon: 'UserOutlined' },
                            { value: 'visit-chrome-store', label: '访问Chrome应用商店', icon: 'UserOutlined' },
                        ]
                    },
                ]
            },
        ]
    }
]

const handleMenuSelect = (option) => {
    console.log(option, 'option')
    userMenuVisible.value = false // 关闭所有（包括二级）
    // 其它弹窗如有，也同时关闭
    // 实际业务：跳转页面或执行逻辑
    // 例: router.push(option.route)
    // 或: emit("select", option)
    // 或: 特定方法(option)
}

const openUserMenu = (e: MouseEvent) => {
    userMenuVisible.value = true
}
const closeUserMenu = () => {
    userMenuVisible.value = false
}

const displayTabs = computed(() => (showAiTab.value ? [aiTab.value] : tabs.value))
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
    (key) => {
        const tab = tabs.value.find((t) => t.key === key)
        if (tab && tab.path) {
            // 路由对象需完整，path不能为空
            const location = {
                path: tab.path,
                query: tab.query ?? {},
                params: tab.params ?? {}
            }
            // 防守性，不能有 undefined
            if (typeof location.path === 'string' && location.path.trim() !== '') {
                router.replace(location)
                return
            }
        }
        // ai-chat 特殊入口
        if (key === 'ai-chat') {
            console.log('[tabwatch] 跳转 ai-chat')
            router.replace('/ai-chat')
            return
        }
        if (key === 'home') {
            console.log('[tabwatch] 跳转 home')
            router.replace('/')
            return
        }
        // fallback: 不做跳转
        console.warn('[tabwatch] activeKey未对应任何tab或入口，什么都不跳。', key, tabs.value)
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
            const idx = tabsStore.tabs.findIndex((t) => t.key === actionInfo.tab.key)
            if (idx !== -1) {
                // 只保留idx及其左边
                const toBeClosed = tabsStore.tabs.slice(idx + 1).map((t) => t.key)
                toBeClosed.forEach((k) => tabsStore.closeTab(k))
            }
            break
        }

        case 'closeOthers': {
            // 关闭除自己以外所有tab
            const toBeClosed = tabsStore.tabs
                .filter((t) => t.key !== actionInfo.tab.key)
                .map((t) => t.key)
            toBeClosed.forEach((k) => tabsStore.closeTab(k))
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
                const idx = tabsStore.tabs.findIndex((t) => t.key === actionInfo.tab.key)
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
    window.api?.isMaximized?.().then((res) => (isMaximized.value = !!res))
})

onBeforeUnmount(() => {
    ;(window.electron?.ipcRenderer as any)?.off('tab-menu-action', handleTabMenuAction)
})
</script>

<style scoped lang="scss">
.no-drag {
    -webkit-app-region: no-drag;
}

.arrow-transition {
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    transform: rotate(0deg);
    transform-origin: center center;
}

.arrow-transition.open {
    transform: rotate(180deg);
}
</style>
