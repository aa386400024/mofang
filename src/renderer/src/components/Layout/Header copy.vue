<template>
    <header class="flex items-center h-10 w-full select-none border-b-0 bg-[#e5e5e5]"
        style="-webkit-app-region: drag">
        <!-- Tabs部分 -->
        <div class="flex items-center h-full flex-1 overflow-hidden pr-16">
            <a-tabs 
                v-model:activeKey="activeTab" 
                :tabBarGutter="0" 
                animated
                size="middle" 
                type="editable-card"
                class="h-full w-full min-w-0"
                @edit="onEdit"
                :hideAdd="hideAdd"
            >
                <a-tab-pane 
                    v-for="tab in tabs" 
                    :key="tab.key" 
                    :tab="h('span', { class: 'flex items-center' }, [ h(tab.icon, { style: {marginRight: '8px', fontSize: '13px'} }), tab.title ])"
                    :closable="tab.closable"
                />
            </a-tabs>
        </div>
        <!-- 右侧窗口按钮 -->
        <div class="flex items-center gap-2 ml-2 no-drag">
            <WinBtn icon="minus" @click="windowControl('min')" />
            <WinBtn 
                :icon="isMaximized ? 'restore' : 'square'" 
                @click="windowControl('max')" 
            />
            <WinBtn icon="close" @click="windowControl('close')" />
        </div>
    </header>
</template>
<script setup lang="ts">
import { ref, h, onMounted, computed, watch } from 'vue'
import { WinBtn } from './index'
import {
    HomeFilled,
    FileOutlined,
    PlusOutlined
} from '@ant-design/icons-vue';

const HOME_TAB = { title: '首页', content: 'home', key: 'home', closable: false, icon: HomeFilled }
const AI_TAB = { title: 'AI 搜索或打开网页', content: 'search-or-open', key: 'ai', closable: false, icon: PlusOutlined }

const tabs = ref([
    { ...HOME_TAB },
    { ...AI_TAB },
])

const activeTab = ref(tabs.value[0].key);

const newTabIndex = ref(0);

// 控制“+”号右侧按钮是否显示
// 只剩首页/AI在开头hideAdd=true，否则false
const hideAdd = computed(() => {
    // 只要有AI tab，隐藏＋；否则显示
    return tabs.value.some(tab => tab.key === 'ai')
})

// 新建一个标签页，如果AI标签存在且不可关闭，先设为可关闭
const add = () => {
    const ai = tabs.value.find(tab => tab.key === 'ai')
    if (ai && !ai.closable) {
        ai.closable = true
    }
    const newKey = `newTab${++newTabIndex.value}`
    tabs.value.push({ title: '新标签页', content: 'Content of new Tab', key: newKey, closable: true, icon: FileOutlined })
    activeTab.value = newKey
}

// 重置，只显示首页与AI，active回首页
const resetTabsToHomeAi = () => {
    tabs.value = [
        { ...HOME_TAB },
        { ...AI_TAB }
    ]
    activeTab.value = 'home'
}

// 删除tab逻辑

const remove = (targetKey: string) => {
    const removedIndex = tabs.value.findIndex(tab => tab.key === targetKey)
    tabs.value = tabs.value.filter(tab => tab.key !== targetKey)
    // 调整当前activeTab
    if (activeTab.value === targetKey) {
        if (tabs.value[removedIndex - 1]) {
            activeTab.value = tabs.value[removedIndex - 1].key
        } else if (tabs.value.length > 0) {
            activeTab.value = tabs.value[0].key
        }
    }
    // 只剩首页或首页+AI(不论AI是否closable)都重置
    if (
        tabs.value.length === 1 && tabs.value[0].key === 'home'
    ) {
        resetTabsToHomeAi()
    } else if (
        tabs.value.length === 2 && tabs.value.find(tab => tab.key === 'ai')
    ) {
        // 无论AI原本closable怎样，都重置
        resetTabsToHomeAi()
    }
}


const onEdit = (targetKey: string | MouseEvent, action: string) => {
    if (action === 'add') {
        add();
    } else {
        remove(targetKey as string);
    }
};

// 点击AI 搜索 tab，让它变成可关闭，并激活
watch(activeTab, (key) => {
    // 如果AI tab被点了，并且还是不可关闭，则设为可关闭
    if (key === 'ai') {
        // 立刻新建新标签页并删掉AI_TAB
        add()
        tabs.value.splice(tabs.value.findIndex(t=>t.key==='ai'), 1)
    }
})

const isMaximized = ref(false)

onMounted(() => {
    window.api?.onMaximize?.(() => (isMaximized.value = true))
    window.api?.onUnmaximize?.(() => (isMaximized.value = false))
    window.api?.isMaximized?.().then(res => (isMaximized.value = !!res))
})

const windowControl = (action: 'min' | 'max' | 'close') => {
    window.api?.win?.(action)
}
</script>
<style scoped lang="scss">
.no-drag {
    -webkit-app-region: no-drag;
}

:deep(.ant-tabs) {
    min-width: 0 !important;
}

:deep(.ant-tabs-nav-wrap) {
    max-width: 100% !important;
    overflow: hidden !important;
}

:deep(.ant-tabs-nav-list) {
    display: flex !important;
    width: 100% !important;
}

:deep(.ant-tabs-tab) {
    flex: 0 1 200px !important;
    max-width: 200px !important;
    min-width: 48px !important;
    display: flex !important;
    align-items: center !important;
    justify-content: flex-start !important;
    overflow: hidden;
    height: 100% !important;
    background: #e5e5e5 !important;
    border-radius: 0 !important;
    font-size: 12px !important;
    padding: 0 !important; // 这里让按钮/内容自己决定左右间距
    min-height: 40px !important;
}

:deep(.ant-tabs-tab .anticon) {
    font-size: 1.1em;
    vertical-align: middle;
}

:deep(.ant-tabs-tab .ant-tabs-tab-btn) {
    text-align: left !important;
    // display: block;
    width: 100%;
    padding-left: 12px;
    padding-right: 0;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    font-size: inherit;
    line-height: 40px !important;
}

:deep(.ant-tabs-tab-remove) {
    font-size: 12px !important;
    margin-right: 12px !important; // 和 padding-left 一致
    margin-left: 6px;
    line-height: 1 !important;
    height: 1em;
    display: flex !important;
    align-items: center;
    vertical-align: middle !important;
}

:deep(.ant-tabs-nav-add) {
    font-size: 14px !important;
    height: 100%;
    border-radius: 0 !important;
    border: none !important;
    color: #555 !important;
    background: #e5e5e5 !important;
    padding: 0 10px;
    display: flex !important;
    align-items: center;
    justify-content: center;
}

:deep(.ant-tabs-nav .ant-tabs-nav-add:hover) {
    background: #dbdbdb !important;
}

:deep(.ant-tabs-nav-add:active) {
    color: #555 !important;
    background-color: #e5e5e5 !important;
}

:deep(.ant-tabs-tab:hover),
:deep(.ant-tabs-tab.ant-tabs-tab-active) {
    background: #fff !important;
}

:deep(.ant-tabs-tab:hover .ant-tabs-tab-btn),
:deep(.ant-tabs-tab.ant-tabs-tab-active .ant-tabs-tab-btn) {
    color: #555 !important;
}

:deep(.ant-tabs-card .ant-tabs-tab) {
    border-radius: 0 !important;
    box-shadow: none !important;
}

:deep(.ant-tabs-nav-add),
:deep(.ant-tabs-tab-remove),
:deep(.ant-tabs-tab .ant-tabs-tab-btn) {
    -webkit-app-region: no-drag;
    cursor: pointer;
}
</style>