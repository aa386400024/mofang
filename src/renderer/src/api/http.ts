import service from './request'
import type { AxiosRequestConfig } from 'axios'

export const get = <T>(url: string, config?: AxiosRequestConfig): Promise<T> =>
    service.get(url, config)

export const post = <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> =>
    service.post(url, data, config)

export const put = <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> =>
    service.put(url, data, config)