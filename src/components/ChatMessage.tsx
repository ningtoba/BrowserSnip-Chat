import { type ComponentProps } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import rehypeRaw from 'rehype-raw'
import type { ChatMessage as ChatMessageType } from '../chat/types'
import { ThinkingBlock } from './ThinkingBlock'
import { CodeBlock } from './CodeBlock'
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
  const isAssistant = message.role === 'assistant'
  const hasReasoning = !!message.reasoning

  return (
    <div
      className={`animate-[fade-in_0.3s_ease-out] flex gap-3 px-4 py-4 ${
        isAssistant ? 'bg-[#0d0f17]/70' : ''
      }`}
    >
      <div
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-[6px] ${
          isUser
            ? 'bg-[#161922] text-[#a8adc4] border border-[#1e2035]'
            : 'bg-[#6366f1]/10 text-[#6366f1] border border-[#6366f1]/20'
        }`}
      >
        {isUser ? <User className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
      </div>

      <div className="min-w-0 flex-1">
        <div className="mb-1.5 flex items-center gap-2">
          <span className="text-xs font-medium text-[#a8adc4]">
            {isUser ? 'You' : 'Assistant'}
          </span>
          <span className="text-[11px] text-[#5c6080]">
            {formatTime(message.timestamp)}
          </span>
        </div>

        {isAssistant && hasReasoning && (
          <ThinkingBlock
            reasoning={message.reasoning!}
            isStreaming={!!isStreaming && !message.content}
          />
        )}

        {message.content ? (
          <div className="message-content font-body text-sm text-[#eeeff5]">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight, rehypeRaw]}
              components={{
                pre: PreBlock,
                code: CodeRenderer,
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        ) : isStreaming && !hasReasoning ? (
          <span className="inline-flex items-center gap-1 text-[#5c6080] font-mono text-xs">
            Thinking
            <span className="animate-[pulse-dot_1.4s_ease-in-out_infinite]" style={{ animationDelay: '0s' }}>.</span>
            <span className="animate-[pulse-dot_1.4s_ease-in-out_infinite]" style={{ animationDelay: '0.2s' }}>.</span>
            <span className="animate-[pulse-dot_1.4s_ease-in-out_infinite]" style={{ animationDelay: '0.4s' }}>.</span>
          </span>
        ) : null}
      </div>
    </div>
  )
}

// ── Custom renderers ──

function PreBlock({ children }: ComponentProps<'pre'>) {
  return <>{children}</>
}

function CodeRenderer({ className, children, ...props }: ComponentProps<'code'>) {
  const match = /language-(\w+)/.exec(className || '')

  // Inline code — no language class means it's not a fenced block
  if (!match) {
    return (
      <code className={className} {...props}>
        {children}
      </code>
    )
  }

  const language = match[1]
  const code = extractCodeText(children)

  return <CodeBlock language={language} code={code} />
}

/** Pull the raw text out of the highlighted children nodes. */
function extractCodeText(children: React.ReactNode): string {
  if (typeof children === 'string') return children
  if (Array.isArray(children)) {
    return children.map((c) => extractCodeText(c)).join('')
  }
  if (children && typeof children === 'object' && 'props' in children) {
    return extractCodeText((children as { props: { children?: React.ReactNode } }).props.children)
  }
  return ''
}
