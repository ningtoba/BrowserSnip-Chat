import { type ComponentProps } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import type { ChatMessage as ChatMessageType } from '../chat/types'
import { ThinkingBlock } from './ThinkingBlock'
import { Copy, User, Sparkles } from 'lucide-react'

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
              rehypePlugins={[rehypeHighlight]}
              components={{ pre: PreWithCopy }}
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

// ── Pre block wrapper — adds header bar + copy button around native output ──

function PreWithCopy({ children, ...preProps }: ComponentProps<'pre'>) {
  // Extract language from className on the <code> child
  const codeChild = extractCodeChild(children)
  const codeProps = (codeChild?.props || {}) as Record<string, unknown>
  const langClass = (codeProps.className as string) || ''
  const match = /language-(\w+)/.exec(langClass)
  const language = match ? match[1] : 'text'
  const codeText = extractText(codeProps.children as React.ReactNode)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(codeText)
      const btn = document.activeElement as HTMLElement | null
      if (btn) {
        const original = btn.innerHTML
        btn.innerHTML = '<span style="color:#34d399">Copied!</span>'
        setTimeout(() => { btn.innerHTML = original }, 2000)
      }
    } catch { /* noop */ }
  }

  return (
    <div className="relative my-2 rounded-lg border border-[#1e2035] overflow-hidden">
      <div className="flex items-center justify-between border-b border-[#1e2035] bg-[#11131c] px-3 py-1.5">
        <span className="font-mono text-[11px] text-[#5c6080] uppercase tracking-wide">
          {language}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 rounded-[4px] px-2 py-0.5 text-[11px] text-[#5c6080] transition-colors hover:bg-[#1e2035] hover:text-[#a8adc4]"
          title="Copy code"
        >
          <Copy className="h-3 w-3" />
          <span>Copy</span>
        </button>
      </div>
      <pre {...preProps} className="m-0 overflow-x-auto p-3 font-mono text-[0.8125rem] leading-relaxed bg-[#0d0f17]">
        {children}
      </pre>
    </div>
  )
}

function extractCodeChild(children: React.ReactNode): React.ReactElement | null {
  if (!children) return null
  if (Array.isArray(children)) {
    for (const child of children) {
      if (isReactElement(child) && child.type === 'code') return child
    }
  }
  if (isReactElement(children) && children.type === 'code') return children
  return null
}

function isReactElement(node: unknown): node is React.ReactElement {
  return node !== null && typeof node === 'object' && 'type' in node && 'props' in node
}

function extractText(node: React.ReactNode): string {
  if (typeof node === 'string') return node
  if (typeof node === 'number' || typeof node === 'boolean') return String(node)
  if (Array.isArray(node)) return node.map(extractText).join('')
  if (isReactElement(node)) return extractText((node.props as Record<string, unknown>).children as React.ReactNode)
  return ''
}
