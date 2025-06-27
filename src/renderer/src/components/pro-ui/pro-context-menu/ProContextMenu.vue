<template>
    <teleport to="body">
        <div class="fixed z-50 bg-white rounded shadow-lg border w-52 overflow-hidden"
            :style="{ left: x + 'px', top: y + 'px' }" @mousedown.stop @contextmenu.prevent>
            <ul>
                <template v-for="(item, idx) in items" :key="idx">
                    <li v-if="!item.type || item.type === 'item'"
                        class="px-4 py-2 hover:bg-gray-100 cursor-pointer text-gray-800 select-none"
                        @click="onClick(item)">{{ item.label }}</li>
                    <li v-else-if="item.type === 'divider'" class="h-px my-1 bg-gray-200"></li>
                </template>
            </ul>
        </div>
    </teleport>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'

export type ContextMenuItem = {
    label?: string
    type?: 'item' | 'divider'
    action?: () => void
}

const props = defineProps<{
    items: ContextMenuItem[]
    x: number
    y: number
}>()
const emits = defineEmits(['close'])

const onClick = (item: ContextMenuItem) => {
    if (item.action) item.action()
    emits('close')
}
// 点击外部关闭
const closeOnClick = (e: MouseEvent) => emits('close')
onMounted(() => document.addEventListener('mousedown', closeOnClick))
onUnmounted(() => document.removeEventListener('mousedown', closeOnClick))
</script>