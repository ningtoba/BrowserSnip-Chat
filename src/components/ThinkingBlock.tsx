import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { ChevronDown, Brain } from 'lucide-react'

interface Props {
  reasoning: string
  isStreaming: boolean
}

export function ThinkingBlock({ reasoning, isStreaming }: Props) {
  // Always start collapsed — user clicks to expand
  const [isOpen, setIsOpen] = useState(false)

  if (!reasoning) return null

  return (
    <div className="mb-3 rounded-[6px] border border-[#1e2035] bg-[#0d0f17] overflow-hidden">
      {/* Header — clickable toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-[#11131c]"
      >
        <Brain className="h-4 w-4 shrink-0 text-[#6366f1]" />
        <span className="text-xs font-medium text-[#a8adc4]">
          {isStreaming ? 'Thinking…' : 'Thought process'}
        </span>
        <ChevronDown
          className={`ml-auto h-4 w-4 shrink-0 text-[#5c6080] transition-transform duration-200 ${
            isOpen ? '' : '-rotate-90'
          }`}
        />
      </button>

      {/* Collapsible content */}
      {isOpen && (
        <div className="border-t border-[#1e2035] px-3 py-2">
          <div className="font-mono text-xs leading-relaxed text-[#5c6080] whitespace-pre-wrap break-words">
            <div className="message-content">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {reasoning}
              </ReactMarkdown>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
