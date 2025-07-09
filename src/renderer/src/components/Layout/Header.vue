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
            <TabBar 
                class="no-drag"
                @switch-tab="(...args) => $emit('switch-tab', ...args)"
                @new-local-tab="(...args) => $emit('new-local-tab', ...args)"/>
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
import { ProPopup, ProOptionSelect } from '../pro-ui'
import { WinBtn, TabBar } from './index'
import { PlusOutlined, CaretUpFilled, CaretDownFilled } from '@ant-design/icons-vue'
import { useRouter } from 'vue-router'
import avatar from '@renderer/assets/img/avatar.png'

defineEmits(['new-local-tab', 'switch-tab'])

const tabsStore = useTabsStore()
const router = useRouter()

const userMenuVisible = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)
const mainPopupRef = ref<HTMLElement | null>(null)

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

const isMaximized = ref(false)
const windowControl = (action: 'min' | 'max' | 'close') => {
    window.api?.win?.(action)
}

onMounted(() => {
    window.api?.onMaximize?.(() => (isMaximized.value = true))
    window.api?.onUnmaximize?.(() => (isMaximized.value = false))
    window.api?.isMaximized?.().then((res) => (isMaximized.value = !!res))
})

onBeforeUnmount(() => {
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
