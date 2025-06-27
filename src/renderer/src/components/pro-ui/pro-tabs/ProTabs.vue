<template>
    <div class="protabs-bar flex items-center h-10 w-full select-none bg-[#e5e5e5] border-b-0"
        style="-webkit-app-region: drag;">
        <!-- 首页 Tab 单独渲染 -->
        <div v-if="showHome" class="ant-tabs-tab custom-home-tab no-drag"
            :class="{ 'ant-tabs-tab-active': modelValue === 'home' }"
            :style="{ width: tabItemWidth + 'px', minWidth: tabItemWidth + 'px' }" tabindex="0"
            @click="() => onTabClick('home')">
            <slot name="home">
                <span class="flex items-center ant-tabs-tab-btn">
                    <HomeFilled class="mr-2" style="font-size:13px;" />
                    首页
                </span>
            </slot>
        </div>

        <!-- Tab 列表 -->
        <div class="flex items-center flex-1 min-w-0 h-full relative" ref="tabListRef">
            <div class="flex items-center w-full h-full overflow-hidden" ref="tabBarRef">
                <template v-for="(tab, idx) in visibleTabs" :key="tab.key">
                    <div class="ant-tabs-tab flex items-center h-full px-0 bg-[#e5e5e5] max-w-50 min-w-12 text-xs relative no-drag"
                        :class="{
                            'ant-tabs-tab-active': modelValue === tab.key,
                            'cursor-not-allowed no-drag-tab': tab.key === 'home',
                            'dragged': dragging && dragIdx === idx
                        }" tabindex="0" @click="() => onTabClick(tab.key)" :data-key="tab.key"
                        :style="{ width: tabItemWidth + 'px' }">
                        <span class="flex items-center ant-tabs-tab-btn">
                            <component v-if="tab.icon" :is="tab.icon" class="tab-icon" />
                            {{ tab.title }}
                        </span>
                        <span v-if="tab.closable" class="ant-tabs-tab-remove" @click.stop="() => onTabClose(tab, idx)">
                            <CloseOutlined />
                        </span>
                    </div>
                </template>
                <MoreTabs v-if="moreTabs.length" :tabs="moreTabs" :model-value="modelValue" @select="onMoreTabSelect"
                    @close="onMoreTabClose"
                    :style="{ width: MORE_BTN_WIDTH + 'px', minWidth: MORE_BTN_WIDTH + 'px' }" />
                <!-- ＋号 -->
                <div v-if="!hideAdd" class="ant-tabs-nav-add flex items-center justify-center h-full no-drag"
                    :style="{ width: ADD_BTN_WIDTH + 'px', minWidth: ADD_BTN_WIDTH + 'px' }" @click="onAddTab">
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
const recomputeTabs = () => {
    const container = tabBarRef.value
    if (!container) return
    const totalWidth = container.offsetWidth
    const tabCount = props.tabs.length
    const CONTROL_BLOCK_WIDTH = ADD_BTN_WIDTH + (tabCount > 0 ? MORE_BTN_WIDTH : 0)
    // 1. 能够所有tab最大宽度
    if (MAX_TAB_WIDTH * tabCount + CONTROL_BLOCK_WIDTH <= totalWidth) {
        visibleTabs.value = props.tabs.slice()
        moreTabs.value = []
        tabItemWidth.value = MAX_TAB_WIDTH
    } else {
        // 2. 只要空间不够所有tab最小宽，visibleTabs数锁死
        let canShow = Math.floor((totalWidth - CONTROL_BLOCK_WIDTH) / MIN_TAB_WIDTH)
        if (canShow < 1) canShow = 1
        let _visible = props.tabs.slice(0, canShow)
        let _more = props.tabs.slice(canShow)
        tabItemWidth.value = MIN_TAB_WIDTH
        // ======== 关键patch：活跃tab若在more里，挪进可见，visibleTabs的最左侧被挤进more ========
        const activeIdx = props.tabs.findIndex(t => t.key === props.modelValue)
        // visible区最后一位的下标
        if (activeIdx >= canShow) {
            // 把visible区第一个暗地里挪进more（它变成more的第一个）
            const moved = _visible.shift()!
            _more.unshift(moved)
            // 把activeTab放进visible最后一位
            const activeTabObj = _more.splice(activeIdx - canShow + 1, 1)[0]
            _visible.push(activeTabObj)
        }

        // ======== end patch ========
        visibleTabs.value = _visible
        moreTabs.value = _more
    }
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

watch(() => props.tabs.length, () => {
    destroySortable()
    nextTick(initSortable)
})

watch(() => props.tabs, recomputeTabs, { deep: true })

onMounted(() => {
    initSortable
    nextTick(() => {
        recomputeTabs()
        new ResizeObserver(recomputeTabs).observe(tabBarRef.value!)
    })
})
onUnmounted(destroySortable)
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