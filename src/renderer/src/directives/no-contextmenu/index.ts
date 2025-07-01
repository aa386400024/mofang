import type { Directive } from 'vue'

const noContextMenu: Directive = {
    mounted(el) {
        el.addEventListener('contextmenu', e => e.preventDefault())
    },
    unmounted(el) {
        el.removeEventListener('contextmenu', e => e.preventDefault())
    }
}
export default noContextMenu