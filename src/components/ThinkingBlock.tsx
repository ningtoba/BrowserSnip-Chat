import { useState } from 'react'
import { ChevronDown, Brain } from 'lucide-react'

interface Props {
  reasoning: string
  isStreaming: boolean
}

export function ThinkingBlock({ reasoning, isStreaming }: Props) {
  const [isOpen, setIsOpen] = useState(false)

  if (!reasoning) return null

  return (
    <div className="mb-3 rounded-doodle border border-cream-border bg-cream-soft overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-cream-border/50"
      >
        <Brain className="h-4 w-4 shrink-0 text-accent" />
        <span className="text-xs font-medium text-ink-soft">
          {isStreaming ? 'Thinking…' : 'Thought process'}
        </span>
        <ChevronDown
          className={`ml-auto h-4 w-4 shrink-0 text-ink-muted transition-transform duration-200 ${
            isOpen ? '' : '-rotate-90'
          }`}
        />
      </button>

      {isOpen && (
        <div className="border-t border-cream-border px-3 py-2 max-h-64 overflow-y-auto">
          <pre className="font-mono text-xs leading-relaxed text-ink-soft whitespace-pre-wrap break-words m-0">
            {reasoning}
          </pre>
        </div>
      )}
    </div>
  )
}
