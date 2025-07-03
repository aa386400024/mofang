import type { Directive } from 'vue'

const resize: Directive = {
    mounted(el, binding) {
        // 监听窗口大小变化
        window.addEventListener('resize', binding.value)
    },
    unmounted(el, binding) {
        window.removeEventListener('resize', binding.value)
    }
}
export default resize