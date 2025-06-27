<template>
    <div class="ant-tabs-tab tab-more no-drag relative flex items-center justify-center" @mouseenter="showMenu = true"
        @mouseleave="showMenu = false" tabindex="0">
        <span class="tab-more-btn flex items-center justify-center w-9 h-full text-lg select-none">
            ...
        </span>
        <transition name="fade">
            <div v-if="showMenu"
                class="tab-more-popup absolute right-0 top-full z-30 bg-white shadow-lg rounded min-w-[140px] py-2"
                @mousedown.prevent>
                <div v-for="tab in tabs" :key="tab.key"
                    class="tab-more-item flex items-center px-4 py-1 cursor-pointer select-none hover:bg-gray-100"
                    :class="{ 'active': tab.key === modelValue }" @click="onTabClick(tab.key)">
                    <component v-if="tab.icon" :is="tab.icon" class="mr-2 text-base" />
                    <span class="flex-1 text-ellipsis overflow-hidden whitespace-nowrap">
                        {{ tab.title }}
                    </span>
                    <span v-if="tab.closable"
                        class="ml-2 tab-more-close text-gray-400 hover:text-red-500 flex items-center"
                        @click.stop="onTabClose(tab)">
                        <CloseOutlined />
                    </span>
                </div>
            </div>
        </transition>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { CloseOutlined } from '@ant-design/icons-vue'
import type { ProTabItem } from './ProTabs.vue'

const props = defineProps<{
    tabs: ProTabItem[]
    modelValue: string
}>()

const emits = defineEmits<{
    (e: 'select', key: string): void
    (e: 'close', tab: ProTabItem): void
}>()

const showMenu = ref(false)

const onTabClick = (key: string) => {
    emits('select', key)
    showMenu.value = false
}
const onTabClose = (tab: ProTabItem) => {
    emits('close', tab)
    // 菜单不收起
}
</script>

<style scoped lang="scss">
.tab-more {
    min-width: 36px;
    cursor: pointer;
    text-align: center;
    background: #e5e5e5;
    user-select: none;

    .tab-more-btn {
        height: 100%;
        line-height: 40px;
        color: #555;
        font-size: 18px;
        padding: 0 4px;
    }

    // 下拉菜单
    .tab-more-popup {
        min-width: 140px;
        margin-top: 2px;
        border-radius: 4px;
        box-shadow: rgba(0, 0, 0, 0.12) 0 1px 10px;

        .tab-more-item {
            min-height: 36px;
            line-height: 36px;
            border-radius: 3px;
            font-size: 13px;

            &.active {
                background: #e5e5e5;
                color: #555;
            }

            .tab-more-close {
                font-size: 14px;
                padding-left: 3px;
                vertical-align: middle;
                border-radius: 50%;
                line-height: 1;
                transition: all .18s;

                &:hover {
                    background: #ffecec;
                }
            }

            &:hover {
                background: #f7f7f7;
            }
        }
    }
}

// fade动画
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.16s;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}
</style>