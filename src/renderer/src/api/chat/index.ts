import { get, post } from '../http'
import type { Message, Session } from '@renderer/types'
import type { ApiResponse } from '@renderer/types'

export const fetchChatSessions = (): Promise<ApiResponse<Session[]>> =>
    get('/chat/sessions')

export const fetchMessages = (sessionId: string): Promise<ApiResponse<Message[]>> =>
    get('/chat/messages', { params: { sessionId } })

export const sendMessage = (sessionId: string, content: string): Promise<ApiResponse<Message>> =>
    post('/chat/send', { sessionId, content })