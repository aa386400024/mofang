<template>
    <div class="page-container bg-[#000] h-full m-10">
        <h2 style="color: #fff">
            AI Chat 页面 (tabKey:
            <b style="color: #69f">{{ tabKey }}</b>

            )
        </h2>
        <p style="color: #fff; margin-top: 16px">
            当前输入值:
            <strong>{{ input }}</strong>
        </p>
        <input
            v-model="input"
            placeholder="输入点啥，切tab再回来，内容还在"
            style="padding: 6px 12px; border-radius: 4px; border: none"
        />
        <button style="margin-left: 16px" @click="count++">点我+1: {{ count }}</button>
        <div style="color: #fff; margin-top: 16px">本页面创建于: {{ createdAt }}</div>
    </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useAiChatTabsStore } from '@renderer/store' // 路径按实际调整
const props = defineProps<{ tabKey?: string }>()
const tabKey = props.tabKey || 'default'

// 取到该tab的独立状态（store每个tabKey自动分仓）
const aiChatTabs = useAiChatTabsStore()
const state = aiChatTabs.getTab(tabKey)

// 本地ref，转存pinia，每tab实例完全独立
const input = ref(state.input)
const count = ref(state.count)
const createdAt = state.createdAt
watch(input, (v) => aiChatTabs.setInput(tabKey, v))
watch(count, (v) => aiChatTabs.setCount(tabKey, v))
onMounted(() => {
    // 可以做日志
    console.log('[AI Chat] mounted', tabKey, createdAt)
})
</script>
