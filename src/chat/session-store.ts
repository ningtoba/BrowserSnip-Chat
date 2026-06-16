import type { ChatSession, StoredData } from './types'
import type { ProviderConfig } from '../providers/types'

const STORAGE_KEY = 'browsersnip-chat-data'

function load(): StoredData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      return JSON.parse(raw) as StoredData
    }
  } catch {
    // corrupted data — reset
  }
  return { sessions: [], activeSessionId: null, lastProviderConfig: null }
}

function save(data: StoredData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export function getSessions(): ChatSession[] {
  return load().sessions.sort((a, b) => b.updatedAt - a.updatedAt)
}

export function getActiveSessionId(): string | null {
  return load().activeSessionId
}

export function getSession(id: string): ChatSession | undefined {
  return load().sessions.find((s) => s.id === id)
}

export function getLastProviderConfig(): ProviderConfig | null {
  return load().lastProviderConfig
}

export function createSession(providerConfig: ProviderConfig): ChatSession {
  const data = load()
  const session: ChatSession = {
    id: generateId(),
    title: 'New Chat',
    messages: [],
    providerConfig,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
  data.sessions.push(session)
  data.activeSessionId = session.id
  data.lastProviderConfig = providerConfig
  save(data)
  return session
}

export function updateSession(id: string, updates: Partial<ChatSession>): void {
  const data = load()
  const idx = data.sessions.findIndex((s) => s.id === id)
  if (idx !== -1) {
    data.sessions[idx] = {
      ...data.sessions[idx],
      ...updates,
      updatedAt: Date.now(),
    }
    save(data)
  }
}

export function deleteSession(id: string): void {
  const data = load()
  data.sessions = data.sessions.filter((s) => s.id !== id)
  if (data.activeSessionId === id) {
    data.activeSessionId = data.sessions[0]?.id ?? null
  }
  save(data)
}

export function setActiveSession(id: string | null): void {
  const data = load()
  data.activeSessionId = id
  save(data)
}

export function updateSessionTitle(id: string, messages: { role: string; content: string }[]): void {
  const firstUserMsg = messages.find((m) => m.role === 'user')
  if (firstUserMsg) {
    const title = firstUserMsg.content.slice(0, 50) + (firstUserMsg.content.length > 50 ? '…' : '')
    updateSession(id, { title })
  }
}

export function saveLastProviderConfig(config: ProviderConfig): void {
  const data = load()
  data.lastProviderConfig = config
  save(data)
}
