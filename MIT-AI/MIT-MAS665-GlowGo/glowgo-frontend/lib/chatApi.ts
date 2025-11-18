import apiClient from './api'
import { ChatRequest, ChatResponse } from '@/types/chat'

export async function postChatMessage(
  message: string,
  sessionId: string | null,
  token: string
): Promise<ChatResponse> {
  const request: ChatRequest = {
    message,
    session_id: sessionId
  }

  const response = await apiClient.post<ChatResponse>(
    '/api/preferences/chat',
    request,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  )

  return response.data
}



