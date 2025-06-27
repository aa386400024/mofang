<template>
    <div class="flex items-center h-12 px-4 bg-white border-b">
        <a-input 
            v-model:value="search" 
            size="small" 
            placeholder="请输入关键词或网址" 
            @pressEnter="onSearch" 
            class="w-full"
            allowClear 
        />
        <!-- 你可以加图标、按钮等 -->
    </div>
</template>
<script setup lang="ts">
import { ref } from 'vue'
const search = ref('')
function onSearch() {
    const val = search.value.trim()
    if (/^(https?:\/\/|www\.)\S+/i.test(val)) {
        // 打开外部网页（如webview）或 electron shell
    } else if (val) {
        // 触发内部搜索
    }

}
</script>