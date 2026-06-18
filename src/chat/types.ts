import type { ProviderConfig } from '../providers/types'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  reasoning?: string
  timestamp: number
}

export interface ChatSession {
  id: string
  title: string
  messages: ChatMessage[]
  providerConfig: ProviderConfig
  createdAt: number
  updatedAt: number
}

export interface StoredData {
  sessions: ChatSession[]
  activeSessionId: string | null
  lastProviderConfig: ProviderConfig | null
}
