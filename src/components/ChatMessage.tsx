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
    <div className={`animate-[fade-in_0.3s_ease-out] flex gap-3 px-4 py-3 ${isUser ? '' : 'bg-[#0d0f17]/70'}`}>
      {/* Avatar */}
      <div
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-[6px] ${
          isUser
            ? 'bg-[#161922] text-[#a8adc4] border border-[#1e2035]'
            : 'bg-[#6366f1]/10 text-[#6366f1] border border-[#6366f1]/20'
        }`}
      >
        {isUser ? <User className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center gap-2">
          <span className="text-xs font-medium text-[#a8adc4]">
            {isUser ? 'You' : 'Assistant'}
          </span>
          <span className="text-[11px] text-[#5c6080]">
            {formatTime(message.timestamp)}
          </span>
        </div>

        <div className="message-content font-body text-sm leading-relaxed text-[#eeeff5]">
          {message.content ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {message.content}
            </ReactMarkdown>
          ) : isStreaming ? (
            <span className="inline-flex items-center gap-1 text-[#5c6080] font-mono text-xs">
              Thinking
              <span className="animate-[pulse-dot_1.4s_ease-in-out_infinite]" style={{ animationDelay: '0s' }}>.</span>
              <span className="animate-[pulse-dot_1.4s_ease-in-out_infinite]" style={{ animationDelay: '0.2s' }}>.</span>
              <span className="animate-[pulse-dot_1.4s_ease-in-out_infinite]" style={{ animationDelay: '0.4s' }}>.</span>
            </span>
          ) : null}
        </div>
      </div>
    </div>
  )
}
