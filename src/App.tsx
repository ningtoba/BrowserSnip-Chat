import { useState, useCallback } from 'react'
import { useBrowserChat } from './chat/useBrowserChat'
import { ProviderSetup } from './components/ProviderSetup'
import { SessionSidebar } from './components/SessionSidebar'
import { ChatWindow } from './components/ChatWindow'
import type { ProviderConfig } from './providers/types'
import { getLastProviderConfig } from './chat/session-store'

type View = 'chat' | 'settings'

export default function App() {
  const [view, setView] = useState<View>(() => {
    const lastConfig = getLastProviderConfig()
    return lastConfig ? 'chat' : 'settings'
  })

  const chat = useBrowserChat()

  const handleConfigured = useCallback((config: ProviderConfig) => {
    chat.createNewSession(config)
    setView('chat')
  }, [chat])

  const handleNewSession = useCallback((config: ProviderConfig) => {
    return chat.createNewSession(config)
  }, [chat])

  const hasConfig = chat.activeSession?.providerConfig != null || getLastProviderConfig() != null

  if (view === 'settings') {
    return (
      <div className="h-full">
        <ProviderSetup
          onConfigured={handleConfigured}
          initialConfig={chat.activeSession?.providerConfig ?? getLastProviderConfig()}
        />
      </div>
    )
  }

  return (
    <div className="flex h-full">
      <SessionSidebar
        sessions={chat.sessions}
        activeSessionId={chat.activeSession?.id ?? null}
        onSelect={chat.selectSession}
        onNew={handleNewSession}
        onDelete={chat.removeSession}
        onOpenSettings={() => setView('settings')}
        currentConfig={chat.activeSession?.providerConfig ?? getLastProviderConfig()}
      />
      <div className="flex flex-1 flex-col bg-[var(--color-surface-0)]">
        <ChatWindow
          messages={chat.messages}
          isStreaming={chat.isStreaming}
          error={chat.error}
          onSend={chat.sendMessage}
          onStop={chat.stopGeneration}
          disabled={!hasConfig}
        />
      </div>
    </div>
  )
}
