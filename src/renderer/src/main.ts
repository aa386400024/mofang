
import './assets/styles/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import { createPinia } from 'pinia'
import router from './router'
import directives from './directives'

const app = createApp(App)
app.use(createPinia())
app.use(router)

Object.entries(directives).forEach(([name, dir]) => {
    app.directive(name, dir)
})
app.mount('#app')