import { useEffect, useRef } from 'react'
import type { ChatMessage as ChatMessageType } from '../chat/types'
import { ChatMessage } from './ChatMessage'
import { ChatInput } from './ChatInput'
import { AlertCircle, X } from 'lucide-react'

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

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, error])

  return (
    <div className="flex h-full flex-col bg-[#0a0b10]">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 && !error ? (
          <div className="flex h-full items-center justify-center">
            <div className="max-w-md text-center animate-[doodle-pop_0.35s_cubic-bezier(0.34,1.56,0.64,1)]">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-[10px] bg-[#6366f1]/10 shadow-[0_0_20px_rgba(99,102,241,0.15)]">
                <svg
                  className="h-8 w-8 text-[#6366f1]"
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
              <h2 className="font-display text-lg font-medium text-[#eeeff5]">
                Start a conversation
              </h2>
              <p className="mt-1 text-sm text-[#a8adc4]">
                Type a message below to begin chatting with the AI.
              </p>
            </div>
          </div>
        ) : (
          <div>
            {messages.map((msg, i) => (
              <ChatMessage
                key={msg.id}
                message={msg}
                isStreaming={isStreaming && i === messages.length - 1 && msg.role === 'assistant'}
              />
            ))}

            {/* Inline error card — shown between messages and input */}
            {error && (
              <div className="mx-4 mt-3 animate-[fade-in_0.3s_ease-out]">
                <div className="doodle-section border-[#f87171]/30 bg-[#f87171]/5">
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[6px] bg-[#f87171]/15">
                      <AlertCircle className="h-4 w-4 text-[#f87171]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#f87171]">Error</p>
                      <p className="mt-0.5 text-sm text-[#fca5a5]">{error}</p>
                    </div>
                    <button
                      onClick={onDismissError}
                      className="shrink-0 rounded-[6px] p-1 text-[#f87171]/60 hover:bg-[#f87171]/10 hover:text-[#f87171] transition-colors"
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
