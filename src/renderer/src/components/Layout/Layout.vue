<template>
    <div class="flex flex-col h-screen w-screen">
        <Header @new-local-tab="handleNewLocalTab" @switch-tab="handleSwitchTab" />
        <AddressBar
            ref="addressBarRef"
            :tab-id="activeTab"
            :value="addressBarValue"
            :can-go-back="canGoBack"
            :can-go-forward="canGoForward"
            @update:value="onUpdateAddressBarValue"
            @address-enter="onAddressBarEnter"
            @back="onBack"
            @forward="onForward"
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
import { ref, onMounted, computed, watch } from 'vue'

const tabs = ref<any[]>([])
const activeTab = ref<number>(-1)
const addressBarValue = ref<string>('')
const addressBarRef = ref<HTMLInputElement>()

const canGoBack = ref(false)
const canGoForward = ref(false)

const currTab = computed(() => tabs.value.find((t) => t.id === activeTab.value))
const refreshTabs = async () => {
    const { tabs: tlist, active } = await window.api.tab.getTabList()
    tabs.value = tlist.map((tab) => ({
        ...tab,
        inputDraft: typeof tab.inputDraft === 'string' ? tab.inputDraft : ''
    }))
    activeTab.value = active
    const activeTabObj = tabs.value.find((t) => t.id === active)
    if (!activeTabObj) {
        addressBarValue.value = ''
    } else if (activeTabObj.inputDraft) {
        // 👉 若有inputDraft，则输入框显示用户输入
        addressBarValue.value = activeTabObj.inputDraft
    } else if (activeTabObj.type === 'web' && activeTabObj.url) {
        // web页显示真实url
        addressBarValue.value = activeTabObj.url
    } else if (activeTabObj.type === 'local-page' && activeTabObj.pageName) {
        addressBarValue.value = `myapp://local-page/${activeTabObj.pageName}`
    } else if (activeTabObj.type === 'console' && activeTabObj.pageName) {
        addressBarValue.value = `myapp://console/${activeTabObj.pageName}`
    } else {
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
    addressBarRef.value?.focus?.()
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

    // 1. 协议/本地页/console/plugin
    const match = txt.match(
        /^myapp:\/\/(?<type>\w[\w\-]*)(?:\/(?<pageName>[^?]+))?(?:\?(?<props>.+))?$/
    )
    let jumpEntry: any = null
    if (match) {
        const type = match.groups?.type as TabType
        const pageName = match.groups?.pageName
        const propsStr = match[3]
        let pageProps: Record<string, string> = {}
        if (propsStr)
            pageProps = Object.fromEntries(new URLSearchParams(propsStr)) as Record<string, string>
        jumpEntry = { type, pageName, pageProps }
    } else {
        // 2. 普通网址
        const isLikelyUrl =
            /^https?:\/\//i.test(txt) || /^[a-zA-Z0-9][a-zA-Z0-9\-_]+(\.[a-zA-Z0-9\-_]+)+/.test(txt)
        if (isLikelyUrl) {
            let url = txt
            if (!/^https?:\/\//i.test(url)) url = `https://${url}`
            jumpEntry = { type: 'web', url }
        } else {
            // 3. 搜索兜底
            const url = `https://baidu.com/s?wd=${encodeURIComponent(txt)}`
            jumpEntry = { type: 'web', url }
        }
    }
    // 跳转
    await window.api.tab.gotoOrReplace(currentTab.id, jumpEntry)
    await window.api.tab.switchTab?.(currentTab.id)
    // 👇 标准做法，立即清空inputDraft
    const t = tabs.value.find((t) => t.id === currentTab.id)
    if (t) {
        t.inputDraft = ''
        window.api.tab.setInputDraft && window.api.tab.setInputDraft(t.id, '')
    }
    await refreshTabs()
    // 不要直接写 addressBarValue，refreshTabs 会根据 inputDraft 和真实url决定
}

const updateNavState = () => {
    const t = currTab.value
    console.log('updateNavState', t)
    if (t && t.type === 'web' && t.id) {
        window.api.tab.getHistory(t.id, 20).then((res) => {
            if (!res) return
            canGoBack.value = typeof res.current === 'number' && res.current > 0
            canGoForward.value =
                typeof res.current === 'number' &&
                res.history &&
                res.current < res.history.length - 1
        })
    } else {
        canGoBack.value = false
        canGoForward.value = false
    }
}

const onBack = async () => {
    const t = currTab.value
    if (t) {
        await window.api.tab.goBack(t.id)
        t.inputDraft = ''
        window.api.tab.setInputDraft && window.api.tab.setInputDraft(t.id, '')
        await refreshTabs()
    }
}
const onForward = async () => {
    const t = currTab.value
    if (t) {
        await window.api.tab.goForward(t.id)
        t.inputDraft = ''
        window.api.tab.setInputDraft && window.api.tab.setInputDraft(t.id, '')
        await refreshTabs()
    }
}

watch(activeTab, updateNavState)

onMounted(() => {
    refreshTabs()
    window.api.tab.onTitleUpdated(refreshTabs)
    window.api.tab.onFaviconUpdated(refreshTabs)
    // window.api.tab.onUrlUpdated(refreshTabs)
    window.api.tab.onActiveChanged(refreshTabs)
    window.api.tab.onOrderUpdated(refreshTabs)
    window.api.tab.onUrlUpdated(updateNavState)
    window.api.tab.onHistoryUpdated(updateNavState)
})
</script>
