<template>
    <div class="flex flex-col h-screen w-screen">
        <Header @new-local-tab="handleNewLocalTab" @switch-tab="handleSwitchTab" />
        <AddressBar
            :value="addressBarValue"
            @update:value="onUpdateAddressBarValue"
            @address-enter="onAddressBarEnter"
        />
        <div class="flex flex-1 min-h-0 overflow-hidden">
            <!-- <Sidebar /> -->
            <div class="flex-1 h-full relative bg-white">
                <DynamicTabContent :tabs="tabs" :activeTab="activeTab" />
            </div>
        </div>
    </div>
</template>
<script setup lang="ts">
import { Header, AddressBar, DynamicTabContent } from './index'
import { ref, onMounted, computed } from 'vue'

const tabs = ref<any[]>([])
const activeTab = ref<number>(-1)
const addressBarValue = ref<string>('')

const currTab = computed(() => tabs.value.find((t) => t.id === activeTab.value))
const refreshTabs = async () => {
    const { tabs: tlist, active } = await window.api.tab.getTabList()
    // 每个tab初始化inputDraft为空字符串（代表“用户输入草稿”）
    tabs.value = tlist.map((tab) => ({
        ...tab,
        inputDraft: typeof tab.inputDraft === 'string' ? tab.inputDraft : ''
    }))
    activeTab.value = active

    // 选当前活跃tab
    const activeTabObj = tabs.value.find((t) => t.id === active)

    if (!activeTabObj) {
        addressBarValue.value = ''
    } else if (activeTabObj.inputDraft) {
        // 用户有输入草稿，优先展示
        addressBarValue.value = activeTabObj.inputDraft
    } else if (activeTabObj.type === 'web' && activeTabObj.url) {
        // 只针对web页，初始展示url
        addressBarValue.value = activeTabObj.url
    } else {
        // 其它类型（比如local-page/console/plugin），没输入过就空
        addressBarValue.value = ''
    }
}

const handleSwitchTab = async (id: number) => {
    await window.api.tab.switchTab(id)
    await refreshTabs()
}

const handleNewLocalTab = async (insertAfterId?: number) => {
    console.log('addressBarValue前', addressBarValue.value)
    let tab
    if (typeof insertAfterId === 'number') {
        tab = await window.api.tab.insertTabAfter(insertAfterId, {
            type: 'local-page',
            pageName: 'aiChat',
            pageProps: {
                title: '新本地页',
                tabKey: `${Date.now()}-${Math.random()}`
            }
        })
    } else {
        tab = await window.api.tab.newLocalTab('aiChat', {
            title: '新本地页',
            tabKey: `${Date.now()}-${Math.random()}`
        })
    }
    await refreshTabs()
    console.log('addressBarValue', addressBarValue.value)
    // 新建tab inputDraft置空，地址栏也清空
    const t = tabs.value.find((t) => t.id === tab.id)
    if (t) {
        console.log('t', t)
        t.inputDraft = ''
        addressBarValue.value = ''
    }
}

const onUpdateAddressBarValue = (val: string) => {
    if (currTab.value) {
        currTab.value.inputDraft = val
        window.api.tab.setInputDraft(currTab.value.id, val)
    }
    addressBarValue.value = val
}
const onAddressBarEnter = async (val: string) => {
    const txt = val.trim()
    const { tabs: tlist, active } = await window.api.tab.getTabList()
    const currentTab = tlist.find((t) => t.id === active)
    if (!currentTab) return

    // 1. 解析协议 myapp://local-page/xxx?foo=bar
    const match = txt.match(
        /^myapp:\/\/(?<type>\w[\w\-]*)(?:\/(?<pageName>[^?]+))?(?:\?(?<props>.+))?$/
    )
    if (match) {
        const type = match.groups?.type as TabType
        const pageName = match.groups?.pageName // 可能为空
        const propsStr = match[3]
        let pageProps: Record<string, string> = {}
        if (propsStr)
            pageProps = Object.fromEntries(new URLSearchParams(propsStr)) as Record<string, string>
        // 按 type 做分支，组装 info
        if (type === 'local-page' || type === 'console') {
            console.log('createLocalTab', type, pageName, pageProps)
            await window.api.tab.replaceTab(currentTab.id, {
                type, // 'local-page' | 'console'
                pageName: pageName || '',
                pageProps
            })
        } else if (type === 'plugin' || type === 'web') {
            // plugin/web类型都要求url字段
            await window.api.tab.replaceTab(currentTab.id, {
                type, // 'plugin' | 'web'
                url: pageProps.url ?? '' // plugin: pageProps.url 或 web页url
            })
        }
        await refreshTabs()

        // 用户跳转后自动填充当前tab.inputDraft
        const t = tabs.value.find((t) => t.id === currentTab.id)
        if (t) t.inputDraft = txt
        addressBarValue.value = txt
        return
    }

    // 2. 网址场景（含没协议的，如www.baidu.com）
    const isLikelyUrl =
        /^https?:\/\//i.test(txt) || /^[a-zA-Z0-9][a-zA-Z0-9\-_]+(\.[a-zA-Z0-9\-_]+)+/.test(txt)
    if (isLikelyUrl) {
        let url = txt
        if (!/^https?:\/\//i.test(url)) url = `https://${url}`

        // 直接replaceTab
        await window.api.tab.replaceTab(currentTab.id, { type: 'web', url })
        await refreshTabs()
        return
    }

    // 3. 搜索兜底
    const searchUrl = `https://baidu.com/s?wd=${encodeURIComponent(txt)}`
    await window.api.tab.replaceTab(currentTab.id, { type: 'web', url: searchUrl })
    await refreshTabs()
    if (currTab.value) currTab.value.inputDraft = searchUrl
    addressBarValue.value = searchUrl
}

onMounted(() => {
    refreshTabs()
    window.api.tab.onTitleUpdated(refreshTabs)
    window.api.tab.onFaviconUpdated(refreshTabs)
    window.api.tab.onUrlUpdated(refreshTabs)
    window.api.tab.onActiveChanged(refreshTabs)
    window.api.tab.onOrderUpdated(refreshTabs)
})
</script>
