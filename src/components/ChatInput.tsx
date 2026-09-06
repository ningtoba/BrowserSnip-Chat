import { useState, useRef, useEffect, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Send, Square } from 'lucide-react'
import { tapDown } from '../lib/motion'

interface Props {
  onSend: (content: string) => void
  onStop: () => void
  isStreaming: boolean
  disabled: boolean
}

export function ChatInput({ onSend, onStop, isStreaming, disabled }: Props) {
  const [input, setInput] = useState('')
  const [focused, setFocused] = useState(false)
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
    <div className="border-t border-cream-border bg-cream-light px-4 py-3">
      <div className="flex items-end gap-3">
        {/* Composer with animated focus ring */}
        <motion.div
          animate={{
            boxShadow: focused
              ? '0 0 0 3px rgba(37, 99, 235, 0.18), 0 1px 2px rgba(27, 27, 24, 0.05)'
              : '0 0 0 0px rgba(37, 99, 235, 0), 0 1px 2px rgba(27, 27, 24, 0.05)',
            borderColor: focused ? '#2563EB' : '#E3E3DD',
          }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="relative flex-1 overflow-hidden rounded-doodle-md border bg-cream-light"
        >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onKeyDown={handleKeyDown}
            placeholder={disabled ? 'Configure a provider to start…' : 'Type a message…'}
            disabled={disabled}
            rows={1}
            className="w-full resize-none py-2.5 px-4 font-body text-[15px] bg-transparent outline-none text-ink disabled:cursor-not-allowed disabled:opacity-40 placeholder:text-ink-muted"
          />
        </motion.div>

        {/* Send ⇄ Stop — visual state swap */}
        <AnimatePresence mode="wait" initial={false}>
          {isStreaming ? (
            <motion.button
              key="stop"
              initial={{ opacity: 0, scale: 0.8, rotate: -90 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.8, rotate: 90 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              whileTap={tapDown}
              onClick={onStop}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-doodle-md bg-danger/10 text-danger transition-colors hover:bg-danger/15 border border-danger/20"
              title="Stop generating"
            >
              <Square className="h-4 w-4" fill="currentColor" />
            </motion.button>
          ) : (
            <motion.button
              key="send"
              initial={{ opacity: 0, scale: 0.8, rotate: -90 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.8, rotate: 90 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              whileTap={tapDown}
              onClick={handleSubmit}
              disabled={!input.trim() || disabled}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-doodle-md bg-accent text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-45"
              title="Send message"
            >
              <Send className="h-4 w-4" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
