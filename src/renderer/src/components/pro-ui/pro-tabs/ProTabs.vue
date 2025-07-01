<template>
    <div class="protabs-bar flex items-center h-10 w-full select-none bg-[#e5e5e5] border-b-0"
        style="-webkit-app-region: drag;">
        <!-- 首页 Tab 单独渲染 -->
        <div 
            v-if="showHome" 
            class="ant-tabs-tab custom-home-tab no-drag"
            :class="{ 'ant-tabs-tab-active': modelValue === 'home' }"
            :style="{ width: tabItemWidth + 'px', minWidth: tabItemWidth + 'px' }" 
            tabindex="0"
            @click="() => onTabClick('home')"
        >
            <slot name="home">
                <span class="flex items-center gap-2 ant-tabs-tab-btn">
                    <HomeFilled style="font-size:13px;" />
                    首页
                </span>
            </slot>
        </div>

        <!-- Tab 列表 -->
        <div class="flex items-center flex-1 min-w-0 h-full relative" ref="tabListRef">
            <div class="flex items-center w-full h-full overflow-hidden" ref="tabBarRef">
                <template v-for="(tab, idx) in visibleTabs" :key="tab.key">
                    <div 
                        class="ant-tabs-tab flex items-center h-full px-0 bg-[#e5e5e5] max-w-50 min-w-12 text-xs relative no-drag"
                        :class="{
                            'ant-tabs-tab-active': modelValue === tab.key,
                            'cursor-not-allowed no-drag-tab': tab.key === 'home',
                            'dragged': dragging && dragIdx === idx
                        }" 
                        tabindex="0" 
                        @click="() => onTabClick(tab.key)" 
                        :data-key="tab.key"
                        :style="{ width: tabItemWidth + 'px' }"
                        @contextmenu.stop.prevent="onTabContextMenu(tab, idx, $event)"
                    >
                        <span class="flex items-center ant-tabs-tab-btn">
                            <component v-if="tab.icon" :is="tab.icon" class="tab-icon" />
                            {{ tab.title }}
                        </span>
                        <span 
                            v-if="tab.closable" 
                            class="ant-tabs-tab-remove" 
                            @click.stop="() => onTabClose(tab, idx)"
                        >
                            <CloseOutlined />
                        </span>
                    </div>
                </template>
                <MoreTabs 
                    v-if="moreTabs.length" 
                    :tabs="moreTabs" 
                    :model-value="modelValue" 
                    @select="onMoreTabSelect"
                    @close="onMoreTabClose"
                    :style="{ width: MORE_BTN_WIDTH + 'px', minWidth: MORE_BTN_WIDTH + 'px' }" 
                />
                <!-- ＋号 -->
                <div 
                    v-if="!hideAdd" 
                    class="ant-tabs-nav-add flex items-center justify-center h-full no-drag"
                    :style="{ width: ADD_BTN_WIDTH + 'px', minWidth: ADD_BTN_WIDTH + 'px' }" 
                    @click="onAddTab"
                >
                    <PlusOutlined />
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { HomeFilled, CloseOutlined, PlusOutlined } from '@ant-design/icons-vue'
import MoreTabs from './MoreTabs.vue'
import Sortable from 'sortablejs'

export interface ProTabItem {
    title: string
    key: string
    icon?: any
    closable?: boolean
    [prop: string]: any
}

const props = defineProps<{
    tabs: ProTabItem[]
    modelValue: string
    hideAdd?: boolean
    showHome?: boolean
}>()

const emits = defineEmits([
    'update:modelValue',    // 切换tab
    'tab-add',              // 新增
    'tab-close',            // 关闭
    'tab-dragend',          // 拖拽完成
])

const tabBarRef = ref<HTMLElement | null>(null)
const dragging = ref(false)
const dragIdx = ref(-1)

const visibleTabs = ref<ProTabItem[]>([])
const moreTabs = ref<ProTabItem[]>([])

const MAX_TAB_WIDTH = 200
const MIN_TAB_WIDTH = 110
const MORE_BTN_WIDTH = 42
const ADD_BTN_WIDTH = 42

const tabItemWidth = ref(MAX_TAB_WIDTH)
const shallowEqualArr = (a1: ProTabItem[], a2: ProTabItem[]) =>
    a1.length === a2.length && a1.every((v, i) => v && a2[i] && v.key === a2[i].key)
const recomputeTabs = () => {
    const container = tabBarRef.value
    if (!container) return
    const totalWidth = container.offsetWidth
    const tabCount = props.tabs.length
    const CONTROL_BLOCK_WIDTH = (props.hideAdd ? 0 : ADD_BTN_WIDTH) + ((tabCount > 0 && tabCount * MIN_TAB_WIDTH + ADD_BTN_WIDTH > totalWidth) ? MORE_BTN_WIDTH : 0)

    // 能放得下所有tab，且每个tab宽未超MAX
    if (tabCount === 0) {
        visibleTabs.value = []
        moreTabs.value = []
        tabItemWidth.value = MAX_TAB_WIDTH
        return
    }

    // 1. 最大能平均分下来的每个tab宽度
    let avgWidth = Math.floor((totalWidth - CONTROL_BLOCK_WIDTH) / tabCount)
    if (avgWidth >= MAX_TAB_WIDTH) {
        // 全部MAX宽，剩余空间不管
        if (
            !shallowEqualArr(visibleTabs.value, props.tabs) ||
            moreTabs.value.length !== 0 ||
            tabItemWidth.value !== MAX_TAB_WIDTH
        ) {
            visibleTabs.value = props.tabs.slice()
            moreTabs.value = []
            tabItemWidth.value = MAX_TAB_WIDTH
        }
        return
    }

    // 2. avgWidth在MIN和MAX之间，全部tab都平均撑满
    if (avgWidth >= MIN_TAB_WIDTH) {
        if (
            !shallowEqualArr(visibleTabs.value, props.tabs) ||
            moreTabs.value.length !== 0 ||
            tabItemWidth.value !== avgWidth
        ) {
            visibleTabs.value = props.tabs.slice()
            moreTabs.value = []
            tabItemWidth.value = avgWidth
        }
        return
    }

    // 3. 放不下，部分tab进more；visible用MIN宽
    // 能展示多少个
    let canShow = Math.floor((totalWidth - CONTROL_BLOCK_WIDTH) / MIN_TAB_WIDTH)
    if (canShow < 1) canShow = 1
    let _visible = props.tabs.slice(0, canShow)
    let _more = props.tabs.slice(canShow)
    // patch逻辑：活跃选项卡在more里要拉进visible最后
    const activeIdx = props.tabs.findIndex(t => t.key === props.modelValue)
    if (activeIdx >= canShow) {
        const moved = _visible.shift()
        if (moved) _more.unshift(moved)
        const activeTabObj = _more.splice(activeIdx - canShow + 1, 1)[0]
        if (activeTabObj) _visible.push(activeTabObj)
    }
    if (
        !shallowEqualArr(visibleTabs.value, _visible) ||
        !shallowEqualArr(moreTabs.value, _more) ||
        tabItemWidth.value !== MIN_TAB_WIDTH
    ) {
        visibleTabs.value = _visible
        moreTabs.value = _more
        tabItemWidth.value = MIN_TAB_WIDTH
    }
}

const onTabContextMenu = (tab, idx, ev) => {
    ev.preventDefault()
    ev.stopPropagation()
    // 发送“tab右键菜单”事件，包括tab信息和鼠标坐标
    window.electron?.ipcRenderer?.invoke('show-tab-context-menu', {
        key: tab.key,
        index: idx,
        // ...其余你需要的信息
        x: ev.x,
        y: ev.y
    })
}


const onMoreTabSelect = (key: string) => {
    emits('update:modelValue', key)
}
const onMoreTabClose = (tab: ProTabItem) => {
    const idx = props.tabs.findIndex(t => t.key === tab.key)
    emits('tab-close', tab, idx)
}

const onTabClick = (key: string) => {
    emits('update:modelValue', key)
}
const onTabClose = (tab: ProTabItem, idx: number) => {
    emits('tab-close', tab, idx)
}
const onAddTab = () => emits('tab-add')

let sortable: Sortable | null = null
const initSortable = () => {
    nextTick(() => {
        if (!tabBarRef.value) return
        destroySortable()
        sortable = Sortable.create(tabBarRef.value, {
            animation: 150,
            filter: '.no-drag-tab', // 禁止home被拖动
            draggable: '.ant-tabs-tab',
            onStart: evt => {
                dragging.value = true
                dragIdx.value = evt.oldIndex ?? -1
            },
            onEnd: onDragEnd
        })
    })
}
const destroySortable = () => {
    sortable?.destroy()
    sortable = null
}

// 监听 tab 拖拽结束，判断是否要脱出tabBar（比如鼠标y小于tabBar顶部10像素/更灵活的判定方式）
const onDragEnd = (evt) => {
    dragging.value = false
    dragIdx.value = -1

    // 拖拽脱出tabBar判定
    const e = evt.originalEvent
    if (e && tabBarRef.value) {
        const mouseX = e.clientX
        const mouseY = e.clientY
        const tabBarRect = tabBarRef.value.getBoundingClientRect()
        const isOut =
            mouseY < tabBarRect.top - 20 ||
            mouseY > tabBarRect.bottom + 20 ||
            mouseX < tabBarRect.left - 20 ||
            mouseX > tabBarRect.right + 20

        if (isOut) {
            const idx = evt.oldIndex ?? -1
            let detachedTab
            if (idx >= 0) {
                detachedTab = visibleTabs.value[idx]  // 你的 tab 是 visibleTabs 还是 props.tabs 注意判断
            }
            if (detachedTab) {
                // 只发送可传递的属性
                const tabData = {
                    title: detachedTab.title,
                    key: detachedTab.key,
                    closable: detachedTab.closable ?? true,
                    // 不带 icon
                };
                window.api.detachTab(tabData)
                emits('tab-close', detachedTab, props.tabs.findIndex(t => t.key === detachedTab.key))
                return
            }
        }
    }

    // 正常拖拽换位
    if (
        evt.oldIndex !== evt.newIndex &&
        evt.oldIndex != null &&
        evt.newIndex != null
    ) {
        emits('tab-dragend', evt.oldIndex, evt.newIndex)
    }
}

let recomputeTimeout: any = null
const recomputeDebounced = () => {
    clearTimeout(recomputeTimeout)
    recomputeTimeout = setTimeout(recomputeTabs, 16)   // 1帧
}

onMounted(() => {
    initSortable()
    nextTick(() => {
        recomputeTabs()
        if (tabBarRef.value) {
            new ResizeObserver(recomputeDebounced).observe(tabBarRef.value)
        }
    })
})
onUnmounted(() => {
    destroySortable()
    clearTimeout(recomputeTimeout)
})

// tabs内容变化重新计算
watch(() => props.tabs, recomputeTabs, { deep: true })
// modelValue变化后也重新算tab排布（比如activeTab变化挤入）
watch(() => props.modelValue, recomputeTabs, { immediate: true })

// 监听 tab 拖拽和 tabs 变化
watch(() => props.tabs.length, () => {
    destroySortable()
    nextTick(initSortable)
})
</script>

<style scoped lang="scss">
/* 覆盖和高度匹配 Antd 风格，并用 SCSS */
.protabs-bar {
    font-size: 12px;

    .custom-home-tab {
        min-width: 60px;
        height: 100%;
        padding: 0;
        margin-right: 1px;
        background: #e5e5e5;
        border-radius: 0;
        font-size: 12px;
        line-height: 40px;
        transition: background .2s;

        .ant-tabs-tab-btn {
            padding-left: 12px;
            padding-right: 0;
            width: 100%;
            overflow: hidden;
            white-space: nowrap;
            text-overflow: ellipsis;
            color: #555;
            font-size: inherit;
            line-height: 40px !important;
        }

        &.ant-tabs-tab-active {
            background: #fff !important;
            color: #555;
        }

        &:hover {
            background: #fff !important;
        }
    }

    .ant-tabs-tab {
        flex: 0 0 #{TAB_MIN_WIDTH}px;
        max-width: 200px;
        min-width: #{TAB_MIN_WIDTH}px;
        display: flex;
        align-items: center;
        justify-content: flex-start;
        overflow: hidden;
        height: 100%;
        background: #e5e5e5;
        border-radius: 0;
        font-size: 12px;
        padding: 0;
        margin-right: 1px;

        .tab-icon {
            margin-right: 8px;
            font-size: 13px;
        }

        .ant-tabs-tab-btn {
            text-align: left !important;
            width: 100%;
            padding-left: 12px;
            padding-right: 0;
            overflow: hidden;
            white-space: nowrap;
            text-overflow: ellipsis;
            color: #555;
            font-size: inherit;
            line-height: 40px !important;
        }

        .ant-tabs-tab-remove {
            font-size: 12px;
            margin-right: 12px;
            margin-left: 6px;
            line-height: 1 !important;
            display: flex;
            align-items: center;
            height: 40px;
            border-radius: 2px;
            color: #999;
            cursor: pointer;
            transition: background 0.15s;

            &:hover {
                color: #333;
            }
        }

        &:hover,
        &.ant-tabs-tab-active {
            background: #fff !important;

            .ant-tabs-tab-btn {
                color: #555 !important;
            }
        }

        &.dragged {
            opacity: 0.5;
        }

        &.no-drag-tab {
            cursor: not-allowed !important;
        }
    }

    .ant-tabs-nav-add {
        font-size: 16px;
        height: 100%;
        border-radius: 0;
        color: #555;
        background: #e5e5e5;
        padding: 0 10px;
        margin-left: 8px;
        transition: background .18s;
        cursor: pointer;

        &:hover {
            background: #dbdbdb;
        }

        &:active {
            background: #e5e5e5;
        }
    }
}

.no-drag {
    -webkit-app-region: no-drag !important;
    cursor: pointer;
    user-select: none;
    height: 100%;
}

.no-drag-tab {
    -webkit-app-region: no-drag !important;
    cursor: not-allowed !important;
}
</style>