import { useState, useRef, useEffect, useCallback } from 'react'
import { Send, Square } from 'lucide-react'

interface Props {
  onSend: (content: string) => void
  onStop: () => void
  isStreaming: boolean
  disabled: boolean
}

export function ChatInput({ onSend, onStop, isStreaming, disabled }: Props) {
  const [input, setInput] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const adjustHeight = useCallback(() => {
    const el = textareaRef.current
    if (el) {
      el.style.height = 'auto'
      el.style.height = `${Math.min(el.scrollHeight, 200)}px`
    }
  }, [])

  useEffect(() => {
    adjustHeight()
  }, [input, adjustHeight])

  useEffect(() => {
    textareaRef.current?.focus()
  }, [])

  const handleSubmit = () => {
    const trimmed = input.trim()
    if (!trimmed || isStreaming || disabled) return
    setInput('')
    onSend(trimmed)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="border-t border-[#1e2035] bg-[#0d0f17] px-4 py-3">
      <div className="mx-auto flex max-w-2xl items-end gap-3">
        <div className="relative flex-1">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={disabled ? 'Configure a provider to start…' : 'Type a message…'}
            disabled={disabled}
            rows={1}
            className="doodle-input resize-none !rounded-[10px] !py-2.5 !px-4 !font-body"
          />
        </div>

        {isStreaming ? (
          <button
            onClick={onStop}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[#f87171]/15 text-[#f87171] transition-colors hover:bg-[#f87171]/25 border border-[#f87171]/20"
            title="Stop generating"
          >
            <Square className="h-4 w-4" fill="currentColor" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={!input.trim() || disabled}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] transition-all duration-200 active:scale-[0.95] disabled:cursor-not-allowed disabled:opacity-30 text-white"
            style={{
              background: 'linear-gradient(135deg, #6366f1, #5558e6)',
              boxShadow: '0 2px 8px rgba(99, 102, 241, 0.3)',
            }}
            title="Send message"
          >
            <Send className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  )
}
