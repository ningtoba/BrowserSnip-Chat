import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism'
import type { ChatMessage as ChatMessageType } from '../chat/types'
import { ThinkingBlock } from './ThinkingBlock'
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
      className={`animate-[fade-in_0.3s_ease-out] flex gap-3 rounded-doodle-md border px-4 py-4 ${
        isUser
          ? 'border-cream-border border-l-2 border-l-accent bg-accent/8'
          : 'border-cream-border bg-cream-light shadow-doodle-card'
      }`}
    >
      <div
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-doodle ${
          isUser
            ? 'bg-cream-soft text-ink-soft border border-cream-border'
            : 'bg-accent/10 text-accent border border-accent/20'
        }`}
      >
        {isUser ? <User className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
      </div>

      <div className="min-w-0 flex-1">
        <div className="mb-1.5 flex items-center gap-2">
          <span className="text-xs font-medium text-ink-soft">
            {isUser ? 'You' : 'Assistant'}
          </span>
          <span className="font-mono text-[11px] text-ink-muted tabular-nums">
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
          <div className="font-body text-[15px] leading-relaxed text-ink">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code({ className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || '')
                  const isBlock = !!match
                  const language = match ? match[1] : 'text'
                  const raw = String(children).replace(/\n$/, '')

                  if (isBlock) {
                    return <CodeBlock language={language} code={raw} />
                  }

                  return (
                    <code className="font-mono text-[0.85em] bg-cream-soft px-1 py-0.5 rounded border border-cream-border text-accent-hover" {...props}>
                      {children}
                    </code>
                  )
                },
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        ) : isStreaming && !hasReasoning ? (
          <span className="inline-flex items-center gap-1 text-ink-muted font-mono text-xs">
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

function CodeBlock({ language, code }: { language: string; code: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(code).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="my-2 rounded-doodle border border-cream-border overflow-hidden">
      <div className="flex items-center justify-between border-b border-cream-border bg-cream-soft px-3 py-1.5">
        <span className="font-mono text-[11px] text-ink-muted uppercase tracking-wide">
          {language}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 rounded-[4px] px-2 py-0.5 text-[11px] text-ink-muted transition-colors hover:bg-cream-border/60 hover:text-ink-soft"
          title="Copy code"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
          </svg>
          <span>{copied ? 'Copied!' : 'Copy'}</span>
        </button>
      </div>
      <SyntaxHighlighter
        language={language}
        style={oneLight}
        customStyle={{
          margin: 0,
          padding: '0.75rem 1rem',
          background: '#F1F1EC',
          fontSize: '0.85rem',
          lineHeight: 1.55,
        }}
        codeTagProps={{
          style: {
            fontFamily: "'JetBrains Mono', 'SF Mono', ui-monospace, Menlo, monospace",
          },
        }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  )
}
