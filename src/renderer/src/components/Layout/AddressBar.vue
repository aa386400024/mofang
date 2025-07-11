<template>
    <div class="flex items-center px-2 py-2 bg-gray-100 space-x-2 select-none">
        <div class="flex items-center space-x-2">
            <!-- 后退按钮，长按弹历史 -->
            <a-dropdown
                :open="backHistoryPopup"
                :getPopupContainer="getBackBtnPopupTarget"
                trigger="custom"
                placement="bottomLeft"
            >
                <template #overlay>
                    <div class="history-popup">
                        <div
                            v-for="(h, idx) in backHistoryList"
                            :key="h"
                            class="history-item"
                            :class="{ active: idx === backCurrentIdx }"
                            @click="jumpToHistory(idx, 'back')"
                            :title="h"
                        >
                            {{ h }}
                        </div>
                        <div class="show-all-hist" @click="showAllHistory">显示全部历史记录</div>
                    </div>
                </template>
                <a-button
                    ref="backBtnRef"
                    type="text"
                    size="small"
                    @mousedown="onBackMouseDown"
                    @mouseup="onBackMouseUp"
                    @mouseleave="onBackMouseUp"
                    @click.prevent="emitBack"
                    :disabled="!canGoBack"
                    v-no-contextmenu
                    class="p-1 reset-button"
                >
                    <icon-left />
                </a-button>
            </a-dropdown>

            <!-- 前进按钮，长按弹历史 -->
            <a-dropdown
                :open="forwardHistoryPopup"
                :getPopupContainer="getForwardBtnPopupTarget"
                trigger="custom"
                placement="bottomLeft"
            >
                <template #overlay>
                    <div class="history-popup">
                        <div
                            v-for="(h, idx) in forwardHistoryList"
                            :key="h"
                            class="history-item"
                            :class="{ active: idx === forwardCurrentIdx }"
                            @click="jumpToHistory(idx, 'forward')"
                            :title="h"
                        >
                            {{ h }}
                        </div>
                        <div class="show-all-hist" @click="showAllHistory">显示全部历史记录</div>
                    </div>
                </template>
                <a-button
                    ref="forwardBtnRef"
                    type="text"
                    size="small"
                    @mousedown="onForwardMouseDown"
                    @mouseup="onForwardMouseUp"
                    @mouseleave="onForwardMouseUp"
                    @click.prevent="emitForward"
                    :disabled="!canGoForward"
                    v-no-contextmenu
                    class="p-1 reset-button"
                >
                    <icon-right />
                </a-button>
            </a-dropdown>

            <a-button
                type="text"
                size="small"
                @click="onReload"
                v-no-contextmenu
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
            :bordered="true"
            :suffix="suffixSlot"
            :allow-clear="false"
            :placeholder="placeholder"
            @pressEnter="onPressEnter"
            @focus="onFocus"
            @blur="onBlur"
        >
            <template #addonBefore>
                <a-button
                    type="text"
                    size="small"
                    @click="onToggleFavorite"
                    v-no-contextmenu
                    class="reset-button web-info"
                >
                    <SettingOutlined :style="{ color: isFavorite ? '#FFD700' : '#888' }" />
                </a-button>
            </template>
            <template #addonAfter>
                <a-button
                    type="text"
                    size="small"
                    @click="onToggleFavorite"
                    v-no-contextmenu
                    class="reset-button"
                >
                    <icon-star :style="{ color: isFavorite ? '#FFD700' : '#888' }" />
                </a-button>
            </template>
        </a-input>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, watch } from 'vue'
import {
    StarOutlined as IconStar,
    ReloadOutlined as IconReload,
    LeftOutlined as IconLeft,
    RightOutlined as IconRight,
    SettingOutlined
} from '@ant-design/icons-vue'

/* --------- Props & Emits ---------- */
const props = defineProps<{
    tabId?: number
    value?: string
    canGoBack?: boolean
    canGoForward?: boolean
    isFavorite?: boolean
    placeholder?: string
}>()
const emits = defineEmits<{
    (e: 'update:value', val: string): void
    (e: 'back'): void
    (e: 'forward'): void
    (e: 'reload'): void
    (e: 'toggle-favorite'): void
    (e: 'address-enter', val: string): void
    (e: 'show-history'): void
}>()
/* ---------- 输入栏原有代码 ---------- */
const inputValue = ref(props.value || '')
const inputRef = ref<HTMLInputElement | null>(null)
const focusState = ref(false)
const isFavorite = computed(() => Boolean(props.isFavorite))
const placeholder = computed(() => props.placeholder || '在豆包中搜索，或打开一个网址')
const suffixSlot = null
const focus = () => {
    nextTick(() => inputRef.value?.focus?.())
}
defineExpose({ focus })
const onPressEnter = () => emits('address-enter', inputValue.value)
const onFocus = () => {
    focusState.value = true
}
const onBlur = () => {
    focusState.value = false
}
watch(
    () => props.value,
    (val) => {
        if (val !== inputValue.value) inputValue.value = val || ''
    }
)
watch(inputValue, (val) => emits('update:value', val))
/* ---------- UI事件 ---------- */
const onToggleFavorite = () => emits('toggle-favorite')
const onReload = () => emits('reload')
const emitBack = () => emits('back')
const emitForward = () => emits('forward')

/* ---------- 历史弹窗相关，实现真正的长按弹窗 ---------- */
// 后退相关
const backBtnRef = ref()
const backHistoryPopup = ref(false)
const backLongPressTimer = ref<any>(null)
const backHistoryList = ref<string[]>([])
const backCurrentIdx = ref(-1)

/** 长按显示后退历史 */
const onBackMouseDown = () => {
    if (!props.tabId || !props.canGoBack) return
    // 延迟350ms触发长按
    backLongPressTimer.value = setTimeout(async () => {
        await fetchHistoryList('back')
        backHistoryPopup.value = true
    }, 350)
}
const onBackMouseUp = () => {
    if (backLongPressTimer.value) clearTimeout(backLongPressTimer.value)
    backLongPressTimer.value = null
    setTimeout(() => (backHistoryPopup.value = false), 200) // 延迟关闭，避免菜单点不到
}
function getBackBtnPopupTarget() {
    // a-dropdown定位
    return backBtnRef.value?.$el || backBtnRef.value?.el
}

// 前进相关
const forwardBtnRef = ref()
const forwardHistoryPopup = ref(false)
const forwardLongPressTimer = ref<any>(null)
const forwardHistoryList = ref<string[]>([])
const forwardCurrentIdx = ref(-1)

const onForwardMouseDown = () => {
    if (!props.tabId || !props.canGoForward) return
    forwardLongPressTimer.value = setTimeout(async () => {
        await fetchHistoryList('forward')
        forwardHistoryPopup.value = true
    }, 350)
}
const onForwardMouseUp = () => {
    if (forwardLongPressTimer.value) clearTimeout(forwardLongPressTimer.value)
    forwardLongPressTimer.value = null
    setTimeout(() => (forwardHistoryPopup.value = false), 200)
}
function getForwardBtnPopupTarget() {
    return forwardBtnRef.value?.$el || forwardBtnRef.value?.el
}

/**
 * 获取后退/前进历史
 * @param type 'back' | 'forward'
 */
async function fetchHistoryList(type: 'back' | 'forward') {
    if (!props.tabId) return
    // 这里建议和preload配合，main进程返回 history,current 且history为全部，current为当前指向索引
    const res = await window.api.tab.getHistory(props.tabId, 30)
    if (!(res && Array.isArray(res.history))) return
    // back：0...current-1，且最近的在最下（和chrome一致）；forward：current+1...history.length-1
    if (type === 'back') {
        backHistoryList.value = res.history.slice(0, res.current) || []
        backCurrentIdx.value = backHistoryList.value.length - 1
    } else {
        forwardHistoryList.value = res.history.slice(res.current + 1) || []
        forwardCurrentIdx.value = 0
    }
}

// 跳转历史项
const jumpToHistory = (idx: number, type: 'back' | 'forward') => {
    if (!props.tabId) return
    // 触发main进程 goToOffset
    const offset = type === 'back' ? idx - backCurrentIdx.value : idx + 1
    window.api.tab.gotoOffset(props.tabId, offset)
    // 关闭弹窗
    type === 'back' ? (backHistoryPopup.value = false) : (forwardHistoryPopup.value = false)
}

// 显示全部历史
const showAllHistory = () => {
    emits('show-history')
    backHistoryPopup.value = false
    forwardHistoryPopup.value = false
}
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

/* 历史弹窗样式 */
.history-popup {
    background: #fff;
    border-radius: 6px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.07);
    min-width: 260px;
    padding: 6px 0 0 0;
}
.history-item {
    padding: 7px 14px;
    cursor: pointer;
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
    font-size: 15px;
    user-select: all;
    transition: background 0.21s;
}
.history-item.active {
    background: #e6f7ff;
    color: #1677ff;
}
.history-item:hover {
    background: #f5f5f5;
}
.show-all-hist {
    border-top: 1px solid #eee;
    padding: 8px 14px 8px 14px;
    color: #888;
    text-align: center;
    font-size: 13px;
    cursor: pointer;
    background: #f5f8fc;
    margin-top: 8px;
    border-bottom-left-radius: 6px;
    border-bottom-right-radius: 6px;
}
.show-all-hist:hover {
    color: #1677ff;
    background: #e6f7ff;
}
</style>
