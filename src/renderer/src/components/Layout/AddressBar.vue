<template>
    <div 
        class="flex items-center px-2 py-2 bg-gray-100 space-x-2 select-none"
        @contextmenu.prevent="onBarContextMenu"
    >
        <div class="flex items-center space-x-2">
            <!-- 导航按钮 -->
            <a-button 
                type="text" 
                size="small" 
                @click="onBack" 
                :disabled="!canGoBack"
                class="p-1 reset-button"
            >
                <icon-left />
            </a-button>
            <a-button 
                type="text" 
                size="small" 
                @click="onForward" 
                :disabled="!canGoForward" 
                class="p-1 reset-button"
            >
                <icon-right />
            </a-button>
            <a-button 
                type="text" 
                size="small" 
                @click="onReload" 
                class="p-1 reset-button"
            >
                <icon-reload />
            </a-button>
        </div>
        <div class="w-2"></div>
        <!-- 地址栏输入框 -->
        <a-input 
            ref="inputRef" 
            v-model:value="inputValue" 
            spellcheck="false" 
            class="flex-1 ml-w-0"
            bordered="true"
            @pressEnter="onPressEnter" 
            @focus="onFocus" 
            @blur="onBlur" 
            @contextmenu.stop="onInputContextMenu"
            :suffix="suffixSlot" 
            :allow-clear="false" 
            :placeholder="placeholder" 
        >
            <template #addonBefore>
                <a-button 
                    type="text" 
                    size="small" 
                    @click="onToggleFavorite" 
                    class="reset-button web-info"
                >
                    <SettingOutlined :style="{ color: isFavorite ? '#FFD700' : '#888' }" />
                </a-button>
            </template>
            <template #addonAfter>
                <!-- 收藏按钮 -->
                <a-button 
                    type="text" 
                    size="small" 
                    @click="onToggleFavorite" 
                    class="reset-button"
                >
                    <icon-star :style="{ color: isFavorite ? '#FFD700' : '#888' }" />
                </a-button>
            </template>
        </a-input>
        
        <!-- 右键菜单 -->
        <pro-context-menu v-if="menuVisible" :items="activeMenuItems" :x="menuPos.x" :y="menuPos.y"
            @close="menuVisible = false" />
    </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, watch } from 'vue'
import { StarOutlined as IconStar, ReloadOutlined as IconReload, LeftOutlined as IconLeft, RightOutlined as IconRight, SettingOutlined } from '@ant-design/icons-vue'
import { ProContextMenu, type ContextMenuItem } from '../pro-ui'
import { message } from 'ant-design-vue'
// const clipboard = window.api.clipboard  不建议提前变量保存

defineOptions({ name: 'ProAddressBar' })
const props = defineProps<{
    value?: string
    canGoBack?: boolean
    canGoForward?: boolean
    isFavorite?: boolean
    placeholder?: string
}>()
const emits = defineEmits<{
    (e: 'update:value', val: string): void
    (e: 'load-url', url: string): void
    (e: 'search', query: string): void
    (e: 'back'): void
    (e: 'forward'): void
    (e: 'reload'): void
    (e: 'toggle-favorite'): void
}>()
// 状态
const inputValue = ref(props.value || '')
const menuVisible = ref(false)
const menuPos = ref({ x: 0, y: 0 })
const focusState = ref(false)
const isFavorite = computed(() => Boolean(props.isFavorite))
// 右键菜单
const inputRef = ref<any>(null)

const copyClipboard = () => {
    if (window.api?.clipboard) {
        window.api.clipboard.writeText(inputValue.value)
        message.success("已复制到剪贴板")
    }
}
const pasteClipboard = () => {
    if (window.api?.clipboard) {
        inputValue.value = window.api.clipboard.readText()
    }
}
const pasteAndGo = () => {
    if (window.api?.clipboard) {
        inputValue.value = window.api.clipboard.readText()
        nextTick(() => onPressEnter())
    }
}
const menuItems: ContextMenuItem[] = [
    { label: '复制', action: copyClipboard },
    { label: '粘贴', action: pasteClipboard },
    { label: '全选', action: () => inputRef.value?.focus() || selectAll() },
    { label: '清除', action: () => (inputValue.value = '') },
    { type: 'divider' },
    { label: '总是显示完整网址', action: () => message.info('演示：可配置功能') }
]
const barMenuItems: ContextMenuItem[] = [
    { label: '刷新', action: () => onReload() },
    { label: '粘贴并前往', action: pasteAndGo }
]
const activeMenuItems = computed(() =>
    focusState.value ? menuItems : barMenuItems
)
// 输入逻辑
const isURL = (input: string): boolean =>
    /^https?:\/\/.+\..+/.test(input) || /^[a-zA-Z0-9\-\_]+(\.[a-zA-Z]+)+/.test(input)
const onPressEnter = () => {
    const txt = inputValue.value.trim()
    if (isURL(txt)) {
        let url = /^(https?:)?\/\//.test(txt) ? txt : 'https://' + txt
        emits('load-url', url)
    } else if (txt) {
        let q = encodeURIComponent(txt)
        let searchUrl = `https://www.baidu.com/s?wd=${q}`
        emits('search', searchUrl)
        emits('load-url', searchUrl)
    }
    emits('update:value', inputValue.value)
}
const onFocus = () => { focusState.value = true }
const onBlur = () => { focusState.value = false }
const onInputContextMenu = (e: MouseEvent) => {
    menuPos.value = { x: e.clientX, y: e.clientY }
    menuVisible.value = true
}
const onBarContextMenu = (e: MouseEvent) => {
    if (!focusState.value) {
        menuPos.value = { x: e.clientX, y: e.clientY }
        menuVisible.value = true
    }
}
const selectAll = () => {
    nextTick(() => {
        const el = inputRef.value?.input
        el && el.select && el.select()
    })
}
// 按钮事件
const onBack = () => emits('back')
const onForward = () => emits('forward')
const onReload = () => emits('reload')
const onToggleFavorite = () => emits('toggle-favorite')
const placeholder = computed(() => props.placeholder || '请输入网址或搜索内容')
const suffixSlot = null
watch(
    () => props.value,
    val => {
        if (val !== inputValue.value) {
            inputValue.value = val || ''
        }
    }
)
</script>

<style scoped lang="scss">
.reset-button {
    height: 32px;
    min-height: 32px;
    padding: 0 8px;
    display: flex;
    align-items: center;
    justify-content: center;
}
:deep(.ant-input-group-addon) {
    padding: 0 !important;
}

:deep(.ant-input-affix-wrapper) {
    line-height: 1.7 !important;
}
.web-info {

}
</style>