import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import vue from '@vitejs/plugin-vue'

import components from 'unplugin-vue-components/vite';
import { AntDesignVueResolver } from 'unplugin-vue-components/resolvers';
import Pages from 'vite-plugin-pages'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()]
  },
  preload: {
    plugins: [externalizeDepsPlugin()]
  },
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src')
      }
    },
    plugins: [
      vue(),
      components({
        resolvers: [
          AntDesignVueResolver({
            importStyle: false, // css in js
          }),
        ],
      }),
      Pages({
        // 可选配置，可以把路径、扩展名等自定义
        dirs: 'src/views', // 你可以用相对renderer根目录的路径
        extensions: ['vue', 'ts', 'js'],
        exclude: ['**/components/*.vue'], // 排除非页面组件
      }),
    ]
  }
})
