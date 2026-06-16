import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { ChatMessage as ChatMessageType } from '../chat/types'
import { User, Sparkles } from 'lucide-react'

interface Props {
  message: ChatMessageType
  isStreaming?: boolean
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export function ChatMessage({ message, isStreaming }: Props) {
  const isUser = message.role === 'user'

  return (
    <div className={`animate-fade-in flex gap-3 px-4 py-3 ${isUser ? '' : 'bg-[var(--color-surface-1)]/50'}`}>
      {/* Avatar */}
      <div
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
          isUser
            ? 'bg-[var(--color-surface-3)] text-[var(--color-text-secondary)]'
            : 'bg-[var(--color-accent)]/10 text-[var(--color-accent)]'
        }`}
      >
        {isUser ? <User className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center gap-2">
          <span className="text-xs font-medium text-[var(--color-text-secondary)]">
            {isUser ? 'You' : 'Assistant'}
          </span>
          <span className="text-[11px] text-[var(--color-text-muted)]">
            {formatTime(message.timestamp)}
          </span>
        </div>

        <div className="message-content text-sm leading-relaxed text-[var(--color-text-primary)]">
          {message.content ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {message.content}
            </ReactMarkdown>
          ) : isStreaming ? (
            <span className="inline-flex items-center gap-1 text-[var(--color-text-muted)]">
              Thinking
              <span className="animate-pulse-dot" style={{ animationDelay: '0s' }}>.</span>
              <span className="animate-pulse-dot" style={{ animationDelay: '0.2s' }}>.</span>
              <span className="animate-pulse-dot" style={{ animationDelay: '0.4s' }}>.</span>
            </span>
          ) : null}
        </div>
      </div>
    </div>
  )
}
