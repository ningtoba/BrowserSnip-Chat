import { type ComponentProps } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
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
              components={{
                code: FencedCode,
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

// ── Fenced code block with Prism highlighting + copy button ──

function FencedCode({ className, children, ...props }: ComponentProps<'code'>) {
  // remark adds "language-xxx" class from fenced code block syntax
  const match = /language-(\w+)/.exec(className || '')
  const language = match ? match[1] : ''
  const isBlock = !!match

  // Inline code — no language class → render as is
  if (!isBlock) {
    return (
      <code className={className} {...props}>
        {children}
      </code>
    )
  }

  // Block code: get raw text from children.
  // react-markdown passes the code as a string (or array of strings).
  const raw = extractCodeText(children)
  const lang = normalizeLanguage(language)

  return <CodeBlock language={lang} code={raw} />
}

function extractCodeText(children: React.ReactNode): string {
  if (typeof children === 'string') return children
  if (typeof children === 'number') return String(children)
  if (Array.isArray(children)) return children.map((c) => (typeof c === 'string' ? c : '')).join('')
  return ''
}

function normalizeLanguage(lang: string): string {
  const aliases: Record<string, string> = {
    py: 'python', js: 'javascript', ts: 'typescript', jsx: 'jsx', tsx: 'tsx',
    rb: 'ruby', yml: 'yaml', sh: 'bash', zsh: 'bash', zshrc: 'bash',
    kt: 'kotlin', kts: 'kotlin', txt: 'text', text: 'text', plaintext: 'text',
    '': 'text',
  }
  return aliases[lang] || lang
}

// ── Code block with header bar + copy button ──

function CodeBlock({ language, code }: { language: string; code: string }) {
  const handleCopy = (e: React.MouseEvent) => {
    navigator.clipboard.writeText(code).catch(() => {})
    const btn = e.currentTarget as HTMLElement
    btn.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#34d399" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg><span style="color:#34d399">Copied</span>'
    setTimeout(() => {
      btn.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg><span>Copy</span>'
    }, 2000)
  }

  return (
    <div className="my-2 rounded-lg border border-[#1e2035] overflow-hidden">
      <div className="flex items-center justify-between border-b border-[#1e2035] bg-[#11131c] px-3 py-1.5">
        <span className="font-mono text-[11px] text-[#5c6080] uppercase tracking-wide">
          {language}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 rounded-[4px] px-2 py-0.5 text-[11px] text-[#5c6080] transition-colors hover:bg-[#1e2035] hover:text-[#a8adc4]"
          title="Copy code"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
          </svg>
          <span>Copy</span>
        </button>
      </div>
      <SyntaxHighlighter
        language={language}
        style={oneDark}
        customStyle={{
          margin: 0,
          padding: '0.75rem 1rem',
          background: '#0d0f17',
          fontSize: '0.8125rem',
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
