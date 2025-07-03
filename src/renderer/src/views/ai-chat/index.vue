<template>
    <div class="page-container bg-[#000]">
        <h2 style="color:#fff">AI Chat 页面 (tabKey: <b style="color:#69f">{{ tabKey }}</b>)</h2>
        <p style="color: #fff; margin-top: 16px;">
            当前输入值: <strong>{{ input }}</strong>
        </p>
        <input v-model="input" placeholder="输入点啥，切tab再回来，内容还在"
            style="padding: 6px 12px; border-radius: 4px; border: none;" />
        <button style="margin-left: 16px;" @click="count++">
            点我+1: {{ count }}
        </button>
        <div style="color:#fff; margin-top:16px;">
            本页面创建于: {{ createdAt }}
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onActivated, onDeactivated, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'

// 当前tab的唯一标识
const route = useRoute()
const tabKey = ref(route.query.tabKey || '')   // 推荐总是带 tabKey

// 本地可变状态
const input = ref('')
const count = ref(0)
const createdAt = new Date().toLocaleString()

onMounted(() => {
    console.log('[AI Chat] mounted', tabKey.value, createdAt)
})
onActivated(() => {
    console.log('[AI Chat] activated', tabKey.value, createdAt)
})
onDeactivated(() => {
    console.log('[AI Chat] deactivated', tabKey.value, createdAt)
})
onBeforeUnmount(() => {
    console.log('[AI Chat] destroy', tabKey.value, createdAt)
})
</script>