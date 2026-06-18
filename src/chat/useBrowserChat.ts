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
  if (!(err instanceof Error)) return 'An unknown error occurred.'

  const msg = err.message

  if (
    msg.includes('429') ||
    msg.includes('quota') ||
    msg.includes('Rate limit') ||
    msg.includes('rate_limit') ||
    msg.includes('RESOURCE_EXHAUSTED')
  ) {
    const retryMatch = msg.match(/retry in (\d+\.?\d*)s/)
    if (retryMatch) {
      const seconds = Math.ceil(parseFloat(retryMatch[1]))
      return `Rate limit exceeded. Please wait ${seconds}s and try again.`
    }
    return 'Rate limit exceeded. Please wait a moment and try again.'
  }

  if (
    msg.includes('401') ||
    msg.includes('403') ||
    msg.includes('Unauthorized') ||
    msg.includes('Forbidden') ||
    msg.includes('Invalid API key') ||
    msg.includes('API key not valid')
  ) {
    return 'Invalid API key. Please check your provider settings.'
  }

  const lastErrorMatch = msg.match(/Last error:\s*(.+?)(?:\n|\* Quota|$)/)
  if (lastErrorMatch) {
    const extracted = lastErrorMatch[1].trim()
    return extracted.replace(/\s*\.\s*$/, '.').replace(/\s*https?:\/\/\S+$/, '').trim()
  }

  const cleaned = msg
    .replace(/^AI_\w+Error:\s*/, '')
    .replace(/^\w+Error:\s*/, '')
    .replace(/^Failed after \d+ attempts\.\s*/, '')
    .trim()

  if (cleaned.length > 300) {
    return cleaned.slice(0, 280) + '…'
  }

  return cleaned || 'An unexpected error occurred.'
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
  dismissError: () => void
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

  const dismissError = useCallback(() => {
    setError(null)
  }, [])

  const sendMessage = useCallback(async (content: string) => {
    const sessionId = activeId

    let session = sessionId ? getSession(sessionId) : null

    if (!session) {
      const lastConfig = getLastProviderConfig()
      if (!lastConfig) {
        setError('Please configure a provider first.')
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
      reasoning: '',
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
      let reasoningText = ''

      for await (const part of result.fullStream) {
        if (part.type === 'reasoning-delta') {
          reasoningText += part.text
        } else if (part.type === 'text-delta') {
          fullText += part.text
        }

        const sessionNow = getSession(session.id)
        if (sessionNow) {
          const msgs = [...sessionNow.messages]
          const lastMsg = msgs[msgs.length - 1]
          if (lastMsg && lastMsg.role === 'assistant') {
            lastMsg.content = fullText
            lastMsg.reasoning = reasoningText || undefined
            updateSession(sessionNow.id, { messages: msgs })
            refreshSessions()
          }
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        return
      }

      const message = extractErrorMessage(err)

      const sessionNow = getSession(session.id)
      if (sessionNow) {
        const msgs = [...sessionNow.messages]
        const lastMsg = msgs[msgs.length - 1]
        if (lastMsg && lastMsg.role === 'assistant' && lastMsg.content === '') {
          lastMsg.content = `⚠️ ${message}`
          updateSession(sessionNow.id, { messages: msgs })
          refreshSessions()
        }
      }

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

    const msgs = session.messages.slice(0, -1)
    updateSession(session.id, { messages: msgs })
    refreshSessions()

    const lastUserMsg = [...msgs].reverse().find((m) => m.role === 'user')
    if (lastUserMsg) {
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
    dismissError,
  }
}
