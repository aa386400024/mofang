<template>
    <Teleport to="body">
        <!-- 主弹窗：防止首次出现时位置异常的穿梭，用 opacity 先隐藏 -->
        <div
            v-show="visible"
            ref="popupRef"
            :class="[
                'bg-white shadow-[0_4px_16px_rgba(0,0,0,0.42)] min-w-[200px] max-w-[96vw] overflow-hidden outline-none px-0 py-2 text-[15px] select-none transition-shadow duration-200',
                props.radius || 'rounded-2xl',
                popupReady ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
            ]"
            :style="popupStyle"
            tabindex="0"
            @keydown.esc="emitClose"
            @mousedown.stop
        >
            <slot v-bind="attrs" v-on="attrs" />
        </div>
        <div
            v-if="visible && mask"
            class="fixed z-[9998] inset-0 bg-transparent"
            @click="emitClose"
        />
    </Teleport>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, nextTick, useAttrs } from 'vue'
import type { CSSProperties } from 'vue'

type AnchorType = HTMLElement | null
const props = defineProps<{
    visible: boolean
    anchorEl?: AnchorType
    placement?: 'bottom-end' | 'bottom-start' | 'top-end' | 'top-start' | 'right' | 'left'
    offsetX?: number
    offsetY?: number
    width?: string | number
    maxWidth?: string | number
    mask?: boolean
    zIndex?: number
    radius?: string
}>()
const emit = defineEmits(['close', 'select'])

const attrs = useAttrs()
const popupRef = ref<HTMLElement | null>(null)

defineExpose({ popupRef })

const popupStyle = ref<CSSProperties>({})
const popupReady = ref(false)

// 定位弹窗，首次渲染时等待 nextTick 后再显示
const updatePosition = () => {
    if (!props.anchorEl || !popupRef.value) return
    const rect = props.anchorEl.getBoundingClientRect()
    const pRect = popupRef.value.getBoundingClientRect()
    let left = 0,
        top = 0
    const offsetX = props.offsetX ?? 0
    const offsetY = props.offsetY ?? 0
    switch (props.placement) {
        case 'bottom-end':
            left = window.scrollX + rect.right - pRect.width + offsetX
            top = window.scrollY + rect.bottom + offsetY
            break
        case 'bottom-start':
            left = window.scrollX + rect.left + offsetX
            top = window.scrollY + rect.bottom + offsetY
            break
        case 'top-end':
            left = window.scrollX + rect.right - pRect.width + offsetX
            top = window.scrollY + rect.top - pRect.height + offsetY
            break
        case 'top-start':
            left = window.scrollX + rect.left + offsetX
            top = window.scrollY + rect.top - pRect.height + offsetY
            break
        case 'right':
            left = window.scrollX + rect.right + offsetX
            top = window.scrollY + rect.top + offsetY
            break
        case 'left':
            left = window.scrollX + rect.left - pRect.width + offsetX
            top = window.scrollY + rect.top + offsetY
            break
        default:
            left = window.scrollX + rect.right - pRect.width + offsetX
            top = window.scrollY + rect.bottom + offsetY
            break
    }
    // 溢出处理
    left = Math.max(0, left)
    top = Math.max(0, top)
    popupStyle.value = {
        position: 'fixed',
        left: `${left}px`,
        top: `${top}px`,
        width: typeof props.width === 'number' ? `${props.width}px` : props.width || undefined,
        maxWidth:
            typeof props.maxWidth === 'number'
                ? `${props.maxWidth}px`
                : props.maxWidth || undefined,
        zIndex: String(props.zIndex ?? 9999)
    }
}

const handleGlobalClick = (e: MouseEvent) => {
    if (popupRef.value && !popupRef.value.contains(e.target as any)) {
        emit('close')
    }
}
const emitClose = () => emit('close')

// 【变化处】在visible变true时，确保弹窗已渲染宽高 → 定位 → 再显示
watch(
    () => props.visible,
    (v) => {
        if (v) {
            popupReady.value = false
            nextTick(() => {
                updatePosition()
                nextTick(() => {
                    popupReady.value = true
                })
            })
        } else {
            popupReady.value = false
        }
    }
)
// slot锚点变动也要重定位
watch(
    () => props.anchorEl,
    () => nextTick(updatePosition)
)

onMounted(() => {
    nextTick(updatePosition)
    window.addEventListener('mousedown', handleGlobalClick)
    window.addEventListener('resize', updatePosition)
})
onBeforeUnmount(() => {
    window.removeEventListener('mousedown', handleGlobalClick)
    window.removeEventListener('resize', updatePosition)
})
</script>
