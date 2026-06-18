import { useState, useCallback } from 'react'
import { Copy, Check } from 'lucide-react'

interface Props {
  language: string
  code: string
}

export function CodeBlock({ language, code }: Props) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard unavailable — silently fail
    }
  }, [code])

  return (
    <div className="group relative my-2 rounded-lg border border-[#1e2035] bg-[#0d0f17] overflow-hidden">
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-[#1e2035] bg-[#11131c] px-3 py-1.5">
        <span className="font-mono text-[11px] text-[#5c6080] uppercase tracking-wide">
          {language}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 rounded-[4px] px-2 py-0.5 text-[11px] text-[#5c6080] transition-colors hover:bg-[#1e2035] hover:text-[#a8adc4]"
          title="Copy code"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3 text-[#34d399]" />
              <span className="text-[#34d399]">Copied</span>
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code content */}
      <pre className="m-0 overflow-x-auto p-3 font-mono text-[0.8125rem] leading-relaxed text-[#a8adc4]">
        <code className={`language-${language}`}>{code}</code>
      </pre>
    </div>
  )
}
