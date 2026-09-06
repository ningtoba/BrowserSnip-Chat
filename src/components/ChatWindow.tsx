import { useEffect, useRef } from 'react'
import type { ChatMessage as ChatMessageType } from '../chat/types'
import { ChatMessage } from './ChatMessage'
import { ChatInput } from './ChatInput'
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
            <div className="max-w-md text-center animate-[doodle-pop_0.25s_cubic-bezier(0.16,1,0.3,1)]">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-doodle-md border border-cream-border bg-cream-light shadow-glow">
                <svg
                  className="h-8 w-8 text-accent"
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
              </div>
              <h2 className="font-display text-lg font-semibold text-ink">
                Start a conversation
              </h2>
              <p className="mt-1 text-[15px] text-ink-soft">
                Type a message below to begin chatting with the AI.
              </p>
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-3xl space-y-3 px-4 py-6">
            {messages.map((msg, i) => (
              <ChatMessage
                key={msg.id}
                message={msg}
                isStreaming={isStreaming && i === messages.length - 1 && msg.role === 'assistant'}
              />
            ))}

            {/* Inline error card */}
            {error && (
              <div className="mt-3 animate-[fade-in_0.2s_ease-out]">
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
              </div>
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
