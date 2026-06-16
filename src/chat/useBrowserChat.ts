import { useState, useCallback, useRef } from 'react'
import { streamText } from 'ai'
import type { ChatMessage, ChatSession } from './types'
import type { ProviderConfig } from '../providers/types'
import { createModel } from '../providers/factory'
import {
  getSessions,
  getActiveSessionId,
  getSession,
  getLastProviderConfig,
  createSession,
  updateSession,
  deleteSession,
  setActiveSession,
  updateSessionTitle,
} from './session-store'

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function extractErrorMessage(err: unknown): string {
  if (!(err instanceof Error)) return 'Unknown error occurred'

  const msg = err.message

  // AI SDK wraps provider errors — extract the meaningful part
  // Pattern: "AI_RetryError: ... Last error: <actual message>"
  const lastErrorMatch = msg.match(/Last error:\s*(.+?)(?:\n|$)/)
  if (lastErrorMatch) {
    return lastErrorMatch[1].trim()
  }

  // Pattern: "Error: <code> <message>"
  const tooManyReq = msg.match(/429.*?(?:You exceeded|Rate limit|quota)/i)
  if (tooManyReq) {
    return 'Rate limit exceeded. Please wait and try again.'
  }

  // Unauthorized
  if (msg.includes('401') || msg.includes('Unauthorized') || msg.includes('Invalid API key')) {
    return 'Invalid API key. Please check your provider settings.'
  }

  // Generic — strip the error name prefix
  return msg.replace(/^AI_\w+Error:\s*/, '').replace(/^\w+Error:\s*/, '')
}

export interface UseBrowserChatReturn {
  sessions: ChatSession[]
  activeSession: ChatSession | null
  messages: ChatMessage[]
  isStreaming: boolean
  error: string | null
  sendMessage: (content: string) => Promise<void>
  stopGeneration: () => void
  selectSession: (id: string) => void
  createNewSession: (config: ProviderConfig) => ChatSession
  removeSession: (id: string) => void
  regenerateLast: () => Promise<void>
}

export function useBrowserChat(): UseBrowserChatReturn {
  const [sessions, setSessions] = useState<ChatSession[]>(() => getSessions())
  const [activeId, setActiveId] = useState<string | null>(() => getActiveSessionId())
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const activeSession = activeId ? getSession(activeId) ?? null : null
  const messages = activeSession?.messages ?? []

  const refreshSessions = useCallback(() => {
    setSessions(getSessions())
  }, [])

  const sendMessage = useCallback(async (content: string) => {
    let session = activeId ? getSession(activeId) : null

    // If no session exists, try to restore last config or bail
    if (!session) {
      const lastConfig = getLastProviderConfig()
      if (!lastConfig) {
        setError('Please configure a provider first')
        return
      }
      session = createSession(lastConfig)
      setActiveId(session.id)
      refreshSessions()
    }

    const userMessage: ChatMessage = {
      id: generateId(),
      role: 'user',
      content,
      timestamp: Date.now(),
    }

    const assistantMessage: ChatMessage = {
      id: generateId(),
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
    }

    const updatedMessages = [...session.messages, userMessage, assistantMessage]
    updateSession(session.id, { messages: updatedMessages })
    updateSessionTitle(session.id, updatedMessages)
    refreshSessions()

    const abortController = new AbortController()
    abortRef.current = abortController
    setIsStreaming(true)
    setError(null)

    try {
      const model = createModel(session.providerConfig)

      const modelMessages = updatedMessages
        .filter((m) => m.role !== 'system' && m.content.length > 0)
        .map((m) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        }))

      const result = streamText({
        model,
        messages: modelMessages,
        abortSignal: abortController.signal,
      })

      let fullText = ''

      for await (const chunk of result.textStream) {
        fullText += chunk
        const session_now = activeId ? getSession(activeId) : null
        if (session_now) {
          const msgs = [...session_now.messages]
          const lastMsg = msgs[msgs.length - 1]
          if (lastMsg && lastMsg.role === 'assistant') {
            lastMsg.content = fullText
            updateSession(session_now.id, { messages: msgs })
            refreshSessions()
          }
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        return
      }
      const message = extractErrorMessage(err)
      setError(message)
    } finally {
      setIsStreaming(false)
      abortRef.current = null
    }
  }, [activeId, refreshSessions])

  const stopGeneration = useCallback(() => {
    abortRef.current?.abort()
  }, [])

  const selectSession = useCallback((id: string) => {
    setActiveSession(id)
    setActiveId(id)
    setError(null)
  }, [])

  const createNewSession = useCallback((config: ProviderConfig): ChatSession => {
    const session = createSession(config)
    setActiveId(session.id)
    refreshSessions()
    setError(null)
    return session
  }, [refreshSessions])

  const removeSession = useCallback((id: string) => {
    deleteSession(id)
    if (activeId === id) {
      const remaining = getSessions()
      setActiveId(remaining[0]?.id ?? null)
    }
    refreshSessions()
  }, [activeId, refreshSessions])

  const regenerateLast = useCallback(async () => {
    const session = activeId ? getSession(activeId) : null
    if (!session || session.messages.length < 2) return

    // Remove last assistant message
    const msgs = session.messages.slice(0, -1)
    updateSession(session.id, { messages: msgs })
    refreshSessions()

    // Re-send the last user message
    const lastUserMsg = [...msgs].reverse().find((m) => m.role === 'user')
    if (lastUserMsg) {
      // Need to remove that user message too since sendMessage will add it again
      const msgsWithoutLastExchange = msgs.slice(0, -1)
      updateSession(session.id, { messages: msgsWithoutLastExchange })
      refreshSessions()
      await sendMessage(lastUserMsg.content)
    }
  }, [activeId, refreshSessions, sendMessage])

  return {
    sessions,
    activeSession,
    messages,
    isStreaming,
    error,
    sendMessage,
    stopGeneration,
    selectSession,
    createNewSession,
    removeSession,
    regenerateLast,
  }
}
