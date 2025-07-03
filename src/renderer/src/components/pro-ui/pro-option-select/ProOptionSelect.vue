<template>
    <div class="pro-option-select w-full" @click.stop>
        <slot name="header" />
        <div v-for="(group, groupIdx) in options" :key="groupIdx" class="group-block">
            <div
                v-if="group.showTitle && group.title"
                class="group-title px-3 py-1 text-xs font-semibold"
            >
                <slot name="group-header" :group="group">{{ group.title }}</slot>
            </div>
            <div>
                <div v-for="(option, optIdx) in group.options" :key="option.value">
                    <!-- 普通项 -->
                    <div
                        v-if="!option.children"
                        class="option px-3 py-2 cursor-pointer hover:bg-gray-100 flex items-center text-xs"
                        :class="{ selected: option.value === modelValue }"
                        @click="selectOption(option)"
                    >
                        <span
                            v-if="option.icon"
                            class="mr-2 text-base flex-shrink-0 flex items-center"
                        >
                            <component :is="iconComp(option.icon)" />
                        </span>
                        <span class="flex-1 truncate">{{ option.label }}</span>
                        <span
                            v-if="option.desc"
                            class="ml-2 text-gray-400 text-xs whitespace-nowrap desc"
                            :title="option.desc"
                        >
                            {{ option.desc }}
                        </span>
                    </div>
                    <!-- 二级菜单项 -->
                    <div
                        v-else
                        class="relative option px-3 py-2 flex items-center group hover:bg-gray-100 text-xs"
                        :ref="setItemRef(`${groupIdx}-${optIdx}`)"
                        @mouseenter="onSubEnter(groupIdx, optIdx)"
                        @mouseleave="onSubLeave"
                    >
                        <span
                            v-if="option.icon"
                            class="mr-2 text-base flex-shrink-0 flex items-center"
                        >
                            <component :is="iconComp(option.icon)" />
                        </span>
                        <span class="flex-1 truncate">{{ option.label }}</span>
                        <span
                            v-if="option.desc"
                            class="ml-2 text-gray-400 text-xs whitespace-nowrap desc"
                            :title="option.desc"
                        >
                            {{ option.desc }}
                        </span>
                        <span class="ml-1 text-gray-400">&gt;</span>
                        <!-- Teleport！二级菜单全局 fixed 显示 -->
                        <Teleport to="body">
                            <div
                                v-if="submenuOpen === `${groupIdx}-${optIdx}`"
                                class="submenu bg-white rounded shadow-lg py-1"
                                :style="submenuPos"
                                @mouseenter="onSubPopupEnter"
                                @mouseleave="onSubPopupLeave"
                            >
                                <template
                                    v-for="(subGroup, subGroupIdx) in option.children"
                                    :key="subGroupIdx"
                                >
                                    <div
                                        v-if="subGroup.showTitle && subGroup.title"
                                        class="sub-group-title px-3 py-1 text-xs font-semibold"
                                    >
                                        <slot name="sub-group-header" :group="subGroup">
                                            {{ subGroup.title }}
                                        </slot>
                                    </div>
                                    <div>
                                        <div
                                            v-for="(subOpt, subOptIdx) in subGroup.options"
                                            :key="subOpt.value"
                                            class="px-3 py-2 cursor-pointer hover:bg-gray-100 whitespace-nowrap flex items-center text-xs"
                                            :class="{ selected: subOpt.value === modelValue }"
                                            @click.stop="selectOption(subOpt)"
                                        >
                                            <span
                                                v-if="subOpt.icon"
                                                class="mr-2 text-base flex-shrink-0 flex items-center"
                                            >
                                                <component :is="iconComp(subOpt.icon)" />
                                            </span>
                                            <span class="flex-1 truncate">
                                                <slot name="sub-option" :option="subOpt">
                                                    {{ subOpt.label }}
                                                </slot>
                                            </span>
                                            <span
                                                v-if="subOpt.desc"
                                                class="ml-2 text-gray-400 text-xs whitespace-nowrap desc"
                                                :title="subOpt.desc"
                                            >
                                                {{ subOpt.desc }}
                                            </span>
                                        </div>
                                        <slot
                                            name="sub-group-middle"
                                            :group="subGroup"
                                            :index="subGroupIdx"
                                        />
                                    </div>
                                    <a-divider
                                        v-if="
                                            subGroup.showDivider &&
                                            subGroupIdx < option.children.length - 1
                                        "
                                        :key="'divider-sub' + subGroupIdx"
                                    />
                                </template>
                            </div>
                        </Teleport>
                    </div>
                    <slot name="group-middle" :group="group" :option="option" :index="optIdx" />
                </div>
            </div>
            <a-divider
                v-if="group.showDivider && groupIdx < options.length - 1"
                :key="'divider-main' + groupIdx"
            />
        </div>
        <slot name="footer" />
    </div>
</template>

<script lang="ts" setup>
import { ref, nextTick } from 'vue'
import type { ComponentPublicInstance } from 'vue'
import * as antdIcons from '@ant-design/icons-vue'
import { Divider as ADivider } from 'ant-design-vue'
import type { Option, OptionGroup } from './types'
import type { CSSProperties } from 'vue'
const props = defineProps<{
    modelValue?: string | number | null
    options: OptionGroup[]
    popupRef?: HTMLElement | null
}>()
const emit = defineEmits<{
    (e: 'update:modelValue', v: string | number | undefined): void
    (e: 'change', v: Option | undefined): void
    (e: 'select', option: Option): void
}>()
const selectOption = (option: Option) => {
    emit('update:modelValue', option.value)
    emit('change', option)
    emit('select', option) // 告诉上层菜单项选中
    submenuOpen.value = null // 可选：立刻关闭二级
}
const iconComp = (icon?: string) => {
    if (!icon) return undefined
    if (icon in antdIcons) return (antdIcons as any)[icon]
    const titleCase = icon.replace(/(^|-)(\w)/g, (_, __, c) => (c ? c.toUpperCase() : ''))
    if (titleCase in antdIcons) return (antdIcons as any)[titleCase]
    return undefined
}
const submenuOpen = ref<string | null>(null)
const submenuPos = ref<CSSProperties>({
    left: '0px',
    top: '0px'
})
const itemRefs = ref<Record<string, Element | ComponentPublicInstance | null>>({})
const setItemRef = (key: string) => (el: Element | ComponentPublicInstance | null) => {
    if (el) itemRefs.value[key] = el
}
let popupHover = false
let closeTimer: any = null
const submenuWidth = 230 // 请与CSS保持一致，最好略大
const submenuMaxHeight = 340 // 根据你的UI场景修改

const onSubEnter = async (groupIdx: number, optIdx: number) => {
    submenuOpen.value = `${groupIdx}-${optIdx}`
    await nextTick()
    const el = itemRefs.value[`${groupIdx}-${optIdx}`]
    if (el instanceof HTMLElement) {
        const rect = el.getBoundingClientRect()
        // 默认右侧弹出
        let left = rect.right
        let top = rect.top

        // 防止右溢出
        if (rect.right + submenuWidth > window.innerWidth) {
            left = rect.left - submenuWidth
        }
        // 防止底部溢出
        if (rect.top + submenuMaxHeight > window.innerHeight) {
            top = Math.max(4, window.innerHeight - submenuMaxHeight - 8)
        }

        submenuPos.value = {
            position: 'fixed',
            left: `${left}px`,
            top: `${top}px`,
            // 可视化提升等级
            zIndex: 99999,
            minWidth: `${submenuWidth}px`,
            color: '#595959'
        }
    }
}
const onSubLeave = () => {
    closeTimer = setTimeout(() => {
        if (!popupHover) submenuOpen.value = null
    }, 70)
}
const onSubPopupEnter = () => {
    popupHover = true
    clearTimeout(closeTimer)
}
const onSubPopupLeave = () => {
    popupHover = false
    submenuOpen.value = null
}
</script>

<style lang="scss" scoped>
.pro-option-select {
    color: #595959;
    font-size: 15px;
    .group-title,
    .sub-group-title {
        color: #8c8c8c;
    }
    .option.selected {
        background-color: #e6f7ff;
        color: #1890ff;
    }
    .option,
    .submenu .option,
    .submenu > div > div {
        display: flex;
        align-items: center;
    }
    .submenu {
        position: fixed !important;
        z-index: 99999 !important;
        min-width: 230px; // 最好和js保持一致
        max-height: 340px; // 根据需要调节
        background: white;
        overflow: auto;
        border-radius: 10px;
        padding: 2px 0;
        box-shadow:
            0 4px 8px rgba(0, 0, 0, 0.3),
            0 0 12px rgba(0, 0, 0, 0.1);
    }
    .desc {
        color: #bfbfbf;
        font-size: 12px;
        white-space: nowrap;
        pointer-events: none;
    }
    
}
:deep(.ant-divider-horizontal) {
    margin: 10px 0;
}

span.flex-1.truncate {
    margin-left: 10px !important;
}
</style>
