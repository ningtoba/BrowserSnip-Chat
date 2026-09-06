import { useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { Variants } from 'framer-motion'
import type { ChatMessage as ChatMessageType } from '../chat/types'
import { ChatMessage } from './ChatMessage'
import { ChatInput } from './ChatInput'
import { springSoft } from '../lib/motion'
import { AlertCircle, X, MessageSquare } from 'lucide-react'

interface Props {
  messages: ChatMessageType[]
  isStreaming: boolean
  error: string | null
  onSend: (content: string) => void
  onStop: () => void
  disabled: boolean
  onDismissError: () => void
}

/** Message mount: fade + rise on a soft spring. Entrance only — streaming
 *  content updates inside a mounted message are never re-animated. */
const messageRise: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: springSoft },
}

export function ChatWindow({ messages, isStreaming, error, onSend, onStop, disabled, onDismissError }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = scrollContainerRef.current
    if (!el) return

    // Only auto-scroll if the user is already near the bottom.
    // If they've scrolled up to read, don't yank them back down.
    const threshold = 80 // px from bottom
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < threshold

    if (isNearBottom) {
      el.scrollTop = el.scrollHeight
    }
  }, [messages, error])

  return (
    <div className="flex h-full flex-col bg-cream">
      {/* Sticky chat header */}
      <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-cream-border bg-glass px-4 py-2.5">
        <MessageSquare className="h-4 w-4 text-accent" />
        <span className="font-display text-sm font-semibold tracking-tight text-ink">BrowserSnip Chat</span>
      </div>

      {/* Messages area */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto">
        {messages.length === 0 && !error ? (
          <div className="flex h-full items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="max-w-md text-center"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.05, type: 'spring', stiffness: 260, damping: 22 }}
                className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-doodle-lg border border-cream-border bg-cream-light shadow-glow"
              >
                <svg
                  className="h-7 w-7 text-accent"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z"
                  />
                </svg>
              </motion.div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-accent">
                In-browser AI
              </p>
              <h2 className="mt-2 font-display text-4xl font-semibold tracking-[-0.03em] text-ink sm:text-5xl">
                What are we making today?
              </h2>
              <p className="mt-3 text-[15px] text-ink-soft">
                Everything runs in this tab — no uploads, no servers, no accounts.
              </p>
            </motion.div>
          </div>
        ) : (
          <div className="mx-auto max-w-3xl space-y-3 px-4 py-6">
            <AnimatePresence>
              {messages.map((msg, i) => (
                <motion.div
                  key={msg.id}
                  variants={messageRise}
                  initial="hidden"
                  animate="visible"
                >
                  <ChatMessage
                    message={msg}
                    isStreaming={isStreaming && i === messages.length - 1 && msg.role === 'assistant'}
                  />
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Inline error card */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className="mt-3"
              >
                <div className="doodle-section border-danger/25 bg-danger/5">
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-doodle bg-danger/10">
                      <AlertCircle className="h-4 w-4 text-danger" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-danger">Error</p>
                      <p className="mt-0.5 text-sm text-danger/90">{error}</p>
                    </div>
                    <button
                      onClick={onDismissError}
                      className="shrink-0 rounded-doodle p-1 text-danger/60 hover:bg-danger/10 hover:text-danger transition-colors"
                      title="Dismiss"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <ChatInput
        onSend={onSend}
        onStop={onStop}
        isStreaming={isStreaming}
        disabled={disabled}
      />
    </div>
  )
}
