<template>
    <div class="tab-bar no-drag bg-[#e5e5e5]" ref="tabBarRef">
        <div class="tab-list">
            <div
                v-for="tab in tabs"
                :key="tab.id"
                class="tab-chrome group"
                :class="{ 'tab-chrome-active': tab.id === activeTab }"
                :style="tabStyle"
                :title="tab.title || tab.url"
                @click="switchTab(tab.id)"
                @contextmenu.prevent="onTabContextMenu($event, tab)"
            >
                <span class="tab-content">
                    <img
                        v-if="tab.favicon"
                        :src="tab.favicon"
                        class="w-4 h-4 flex-shrink-0 rounded"
                        style="margin-right: 6px"
                        :alt="tab.title || 'icon'"
                    />
                    <GlobalOutlined
                        v-else
                        class="text-[16px] text-gray-400 flex-shrink-0"
                        style="margin-right: 6px"
                    />
                    <span class="tab-title">{{ tab.title || tab.url }}</span>
                </span>
                <button
                    v-if="tabs.length > 1"
                    class="close-btn"
                    @click.stop="closeTab(tab.id)"
                    :aria-label="`关闭${tab.title || tab.url}`"
                    tabindex="-1"
                >
                    <CloseOutlined class="text-xs" />
                </button>
            </div>
            <!-- 添加按钮始终在最后一个tab右侧 -->
            <button
                class="tab-add-btn"
                @click="newTab"
                aria-label="新建标签"
                title="新建标签(Ctrl+T)"
                tabindex="0"
            >
                <PlusOutlined class="text-lg" style="font-size: 14px" />
            </button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { CloseOutlined, PlusOutlined, GlobalOutlined } from '@ant-design/icons-vue'
import Sortable from 'sortablejs'
const tabs = ref<{ id: number; url: string; title?: string; favicon?: string }[]>([])
const activeTab = ref<number>(-1)
const defaultUrl = 'https://www.baidu.com'
const tabBarRef = ref<HTMLElement | null>(null)
const MIN_TAB_WIDTH = 64
const MAX_TAB_WIDTH = 192
const tabStyle = computed(() => {
    if (!tabBarRef.value) return {}
    // 计算可用宽度
    const barWidth = tabBarRef.value.clientWidth || 900
    const addBtnWidth = 40
    const count = tabs.value.length
    let availableWidth = barWidth - addBtnWidth - 8 // 8px内边距
    let tabPx = Math.floor(availableWidth / count)
    tabPx = Math.max(MIN_TAB_WIDTH, Math.min(MAX_TAB_WIDTH, tabPx))
    return {
        width: tabPx + 'px',
        minWidth: MIN_TAB_WIDTH + 'px',
        maxWidth: MAX_TAB_WIDTH + 'px'
    }
})

let sortable: Sortable | null = null
const newTab = async () => {
    await window.api.tab.newTab(defaultUrl)
    await refresh()
}
const switchTab = async (id: number) => {
    await window.api.tab.switchTab(id)
}
const closeTab = async (id: number) => {
    await window.api.tab.closeTab(id)
    await refresh()
}

const refresh = async () => {
    const { tabs: tlist, active } = await window.api.tab.getTabList()
    tabs.value = tlist
    activeTab.value = active
}
const moveTab = async (oldIndex: number, newIndex: number) => {
    await window.api.tab.moveTab(oldIndex, newIndex)
    await refresh()
}

const onTabContextMenu = (e: MouseEvent, tab: (typeof tabs.value)[0]) => {
    const index = tabs.value.findIndex((t) => t.id === tab.id)
    window.api.tab.showTabContextMenu({
        id: tab.id,
        url: tab.url,
        title: tab.title,
        x: e.x,
        y: e.y,
        index,
        total: tabs.value.length
    })
}

const onTabMenuAction = async (e: any, { type, tab }: { type: string; tab: any }) => {
    if (!tab) return
    switch (type) {
        case 'close':
            closeTab(tab.id)
            break
        case 'closeRight': {
            // 关闭右侧所有tab
            const index = tabs.value.findIndex((t) => t.id === tab.id)
            const ids = tabs.value.slice(index + 1).map((t) => t.id)
            for (const id of ids) await closeTab(id)
            break
        }
        case 'newRight': {
            // 新建tab插入到当前tab右侧
            await window.api.tab.insertTabAfter?.(tab.id, defaultUrl) // 需要你主进程实现tab:insert类似API, 没有则跳过
            await refresh()
            break
        }
        case 'reload': {
            const t = tabs.value.find((t) => t.id === tab.id)
            if (t) window.api.tab.gotoTabUrl(tab.id, t.url)
            break
        }
        case 'copy': {
            // 尝试用你的剪贴板api
            window.api.clipboard.writeText(tab.url)
            break
        }
        case 'closeOthers': {
            const ids = tabs.value.map((t) => t.id).filter((id) => id !== tab.id)
            for (const id of ids) await closeTab(id)
            break
        }
    }
}

onMounted(() => {
    refresh()
    window.api.tab.onTitleUpdated(() => refresh())
    window.api.tab.onFaviconUpdated(() => refresh())
    window.api.tab.onUrlUpdated(() => refresh())
    window.api.tab.onActiveChanged(() => refresh())
    window.api.tab.tabMenuAction(onTabMenuAction)

    const obs = new ResizeObserver(() => nextTick(refresh))
    obs.observe(tabBarRef.value!)

    // 初始化拖拽
    sortable = Sortable.create(tabBarRef.value!.querySelector('.tab-list'), {
        animation: 120,
        ghostClass: 'sortable-ghost', // 拖动中的类名
        filter: '.tab-add-btn', // 排除“新建标签”按钮
        draggable: '.tab-chrome', // 只允许 tab 拖动
        onEnd(evt) {
            // evt.oldIndex, evt.newIndex 均为排序前/后的位置
            // 注意：这里的index以tab-list内元素为基准，所以tab-add-btn不计数
            if (evt.oldIndex == null || evt.newIndex == null || evt.oldIndex === evt.newIndex)
                return
            moveTab(evt.oldIndex, evt.newIndex)
        }
    })

    onBeforeUnmount(() => {
        obs.disconnect()
        sortable?.destroy()
        window.api.tab.offTabMenuAction(onTabMenuAction)
    })
})
</script>

<style scoped lang="scss">
.sortable-ghost {
    opacity: 0.7;
    background: #ddeafd80 !important;
}
.tab-bar {
    width: 100%;
    height: 40px;
    border-bottom: 1px solid #d7dbe0;
    overflow: hidden;
    display: flex;
    align-items: flex-end;
    .tab-list {
        display: flex;
        align-items: flex-end;
        width: 100%;
        height: 100%;
        padding: 0 0 0 8px;
        position: relative;
        overflow: hidden;
    }
}
.tab-chrome {
    display: flex;
    align-items: center;
    height: 34px;
    margin-right: 2px;
    margin-top: 6px;
    border-radius: 10px 10px 0 0 / 15px 15px 0 0;
    background: linear-gradient(180deg, #f9f9f9 80%, #eee 100%);
    border: 1px solid transparent;
    border-bottom: 0;
    font-size: 13px;
    line-height: 34px;
    /* padding: 0 12px 0 9px; // 删掉padding，交给内容区自己定宽 */
    position: relative;
    z-index: 1;
    min-width: 64px;
    max-width: 192px;
    overflow: hidden;
    transition: all 0.15s cubic-bezier(0.61, 0.33, 0.44, 1.01);
    cursor: pointer;
    color: #555;

    .tab-content {
        display: flex;
        align-items: center;
        flex: 1 1 0;
        min-width: 0;
        padding-left: 9px;
        padding-right: 6px;
        overflow: hidden;
        .tab-title {
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            max-width: 100%;
        }
    }
    .close-btn {
        flex: 0 0 auto;
        width: 20px;
        height: 20px;
        margin: 0 6px 0 0;
        display: flex;
        justify-content: center;
        align-items: center;
        background: transparent;
        border: none;
        outline: none;
        opacity: 0;
        visibility: hidden;
        transition: opacity 0.18s;
        color: #bbb;
        &:hover {
            background: #feeeee;
            color: #e45d5d;
            border-radius: 50%;
        }
    }
    &:hover .close-btn,
    &.tab-chrome-active .close-btn {
        opacity: 1;
        visibility: visible;
    }
}
.tab-chrome.tab-chrome-active {
    background: #fff;
    border: 1px solid #c5d0db;
    border-bottom: 1.5px solid #fff;
    color: #1677ff;
    font-weight: 600;
    box-shadow: 0 3px 10px 1px #a7b8c238;
    z-index: 2;
}
.tab-chrome:not(.tab-chrome-active):hover {
    background: #fff;
    color: #1677ff;
}
.tab-add-btn {
    flex-shrink: 0;
    margin-left: 3px;
    margin-right: 12px;
    height: 30px;
    width: 30px;
    border-radius: 10px;
    border: none;
    background: transparent;
    color: #888;
    display: flex;
    align-items: center;
    justify-content: center;
    transition:
        background 0.13s,
        color 0.13s;
    cursor: pointer;
    z-index: 10;
    &:hover,
    &:focus {
        background: #ddeafd;
        color: #1677ff;
    }
    &:active {
        background: #cfe0fe;
    }
}
</style>
