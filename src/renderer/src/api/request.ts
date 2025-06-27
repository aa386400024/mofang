import axios, { AxiosInstance, AxiosRequestConfig } from 'axios'
// baseURL 可根据package.json或配置自动判断 dev/prod 环境
const service: AxiosInstance = axios.create({
    baseURL: '', // 后端API地址
    timeout: 15000,
    // 可加headers等
})

// 请求拦截器
service.interceptors.request.use(
    (config: AxiosRequestConfig) => {
        // 比如token自动携带
        // config.headers.Authorization = 'Bearer ' + token
        return config
    },
    error => Promise.reject(error)
)

// 响应拦截器、错误处理
service.interceptors.response.use(
    response => response.data,
    error => Promise.reject(error)
)

export default service
