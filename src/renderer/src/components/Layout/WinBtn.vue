<template>
    <div>
        <button :class="[
            'w-10 h-10 flex items-center justify-center hover:bg-gray-300 text-[#333] transition',
            icon === 'close' ? 'hover:bg-red-500 hover:text-white' : ''
        ]" @click="emit('click')" tabindex="-1" type="button">
            <span v-if="icon === 'minus'">
                <MinusOutlined :style="{ fontSize: '12px' }" />
            </span>
            <span v-else-if="icon === 'square'">
                <BorderOutlined :style="{ fontSize: '12px' }" />
            </span>
            <span v-else-if="icon === 'restore'">
                <CopyOutlined :style="{ fontSize: '12px' }" />
            </span>
            <span v-else-if="icon === 'close'">
                <CloseOutlined :style="{ fontSize: '12px' }" />
            </span>
        </button>
    </div>
</template>
<script setup lang="ts">
import {
    MinusOutlined,
    BorderOutlined,
    CopyOutlined,
    CloseOutlined
} from '@ant-design/icons-vue'
// icon 值推荐支持 'minus' | 'square' | 'restore' | 'close'
const props = defineProps<{
    icon: 'minus' | 'square' | 'restore' | 'close'
}>()

const emit = defineEmits(['click'])
</script>

<style scoped lang="scss">
:deep(.anticon) {
    vertical-align: 0 !important;
    display: inline-flex;
    align-items: center;
    height: 1em;
}
</style>