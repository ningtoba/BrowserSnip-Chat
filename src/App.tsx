import { useState, useCallback } from 'react'
import { AnimatePresence, MotionConfig, motion } from 'framer-motion'
import type { Variants } from 'framer-motion'
import { useBrowserChat } from './chat/useBrowserChat'
import { ProviderSetup } from './components/ProviderSetup'
import { SessionSidebar } from './components/SessionSidebar'
import { ChatWindow } from './components/ChatWindow'
import type { ProviderConfig } from './providers/types'
import { getLastProviderConfig } from './chat/session-store'
import { easeOut } from './lib/motion'

type View = 'chat' | 'settings'

/** View swap: fade + rise in, quick fade + lift out. */
const viewTransition: Variants = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0, transition: easeOut },
  exit: { opacity: 0, y: -10, transition: { duration: 0.18, ease: 'easeIn' } },
}

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

  return (
    <MotionConfig reducedMotion="user">
      <AnimatePresence mode="wait">
        {view === 'settings' ? (
          <motion.div
            key="settings"
            variants={viewTransition}
            initial="initial"
            animate="animate"
            exit="exit"
            className="h-screen"
          >
            <ProviderSetup
              onConfigured={handleConfigured}
              initialConfig={chat.activeSession?.providerConfig ?? getLastProviderConfig()}
            />
          </motion.div>
        ) : (
          <motion.div
            key="chat"
            variants={viewTransition}
            initial="initial"
            animate="animate"
            exit="exit"
            className="flex h-screen"
          >
            <SessionSidebar
              sessions={chat.sessions}
              activeSessionId={chat.activeSession?.id ?? null}
              onSelect={chat.selectSession}
              onNew={handleNewSession}
              onDelete={chat.removeSession}
              onOpenSettings={() => setView('settings')}
              currentConfig={chat.activeSession?.providerConfig ?? getLastProviderConfig()}
            />
            <div className="flex flex-1 flex-col bg-cream">
              <ChatWindow
                messages={chat.messages}
                isStreaming={chat.isStreaming}
                error={chat.error}
                onSend={chat.sendMessage}
                onStop={chat.stopGeneration}
                disabled={!hasConfig}
                onDismissError={chat.dismissError}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </MotionConfig>
  )
}
