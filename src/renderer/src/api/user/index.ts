import { get, post } from '../http'
import type { User } from '@renderer/types'
import type { ApiResponse } from '@renderer/types'

export const login = (username: string, password: string): Promise<ApiResponse<User>> =>
    post('/user/login', { username, password })

export const fetchUserInfo = (): Promise<ApiResponse<User>> =>
    get('/user/info')