<template>
    <div 
        class="flex items-center px-2 py-2 bg-gray-100 space-x-2 select-none"
    >
        <div class="flex items-center space-x-2">
            <!-- 导航按钮 -->
            <a-button 
                type="text" 
                size="small" 
                @click="onBack" 
                :disabled="!canGoBack"
                v-no-contextmenu
                class="p-1 reset-button"
            >
                <icon-left />
            </a-button>
            <a-button 
                type="text" 
                size="small" 
                @click="onForward" 
                :disabled="!canGoForward" 
                v-no-contextmenu
                class="p-1 reset-button"
            >
                <icon-right />
            </a-button>
            <a-button 
                type="text" 
                size="small" 
                @click="onReload" 
                v-no-contextmenu
                class="p-1 reset-button"
            >
                <icon-reload />
            </a-button>
        </div>
        <div class="w-2"></div>
        <!-- 地址栏输入框 -->
        <a-input
            v-model:value="inputValue" 
            spellcheck="false" 
            class="flex-1 ml-w-0"
            :bordered="true"
            :suffix="suffixSlot" 
            :allow-clear="false" 
            :placeholder="placeholder" 
            @pressEnter="onPressEnter" 
            @focus="onFocus" 
            @blur="onBlur"
        >
            <template #addonBefore>
                <a-button 
                    type="text" 
                    size="small" 
                    @click="onToggleFavorite" 
                    v-no-contextmenu
                    class="reset-button web-info"
                >
                    <SettingOutlined :style="{ color: isFavorite ? '#FFD700' : '#888' }" />
                </a-button>
            </template>
            <template #addonAfter>
                <!-- 收藏按钮 -->
                <a-button 
                    type="text" 
                    size="small" 
                    @click="onToggleFavorite" 
                    v-no-contextmenu
                    class="reset-button"
                >
                    <icon-star :style="{ color: isFavorite ? '#FFD700' : '#888' }" />
                </a-button>
            </template>
        </a-input>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, watch } from 'vue'
import { StarOutlined as IconStar, ReloadOutlined as IconReload, LeftOutlined as IconLeft, RightOutlined as IconRight, SettingOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'

defineOptions({ name: 'ProAddressBar' })
const props = defineProps<{
    value?: string
    canGoBack?: boolean
    canGoForward?: boolean
    isFavorite?: boolean
    placeholder?: string
}>()
const emits = defineEmits<{
    (e: 'update:value', val: string): void
    (e: 'load-url', url: string): void
    (e: 'search', query: string): void
    (e: 'back'): void
    (e: 'forward'): void
    (e: 'reload'): void
    (e: 'toggle-favorite'): void
    (e: 'address-enter', val: string): void
}>()
// 状态
const inputValue = ref(props.value || '')
const focusState = ref(false)
const isFavorite = computed(() => Boolean(props.isFavorite))
const onPressEnter = () => {
    emits('address-enter', inputValue.value)
}
const onFocus = () => { focusState.value = true }
const onBlur = () => { focusState.value = false }
// 按钮事件
const onBack = () => emits('back')
const onForward = () => emits('forward')
const onReload = () => emits('reload')
const onToggleFavorite = () => emits('toggle-favorite')
const placeholder = computed(() => props.placeholder || '请输入网址或搜索内容')
const suffixSlot = null
watch(
    () => props.value,
    val => {
        if (val !== inputValue.value) {
            inputValue.value = val || ''
        }
    }
)
</script>

<style scoped lang="scss">
.reset-button {
    height: 32px;
    min-height: 32px;
    padding: 0 8px;
    display: flex;
    align-items: center;
    justify-content: center;
}
:deep(.ant-input-group-addon) {
    padding: 0 !important;
}

:deep(.ant-input-affix-wrapper) {
    line-height: 1.7 !important;
}
.web-info {

}
</style>