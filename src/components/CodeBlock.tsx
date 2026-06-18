import { useState, useCallback } from 'react'
import { Copy, Check } from 'lucide-react'

interface Props {
  language: string
  children: React.ReactNode
}

export function CodeBlock({ language, children }: Props) {
  const [copied, setCopied] = useState(false)

  const rawCode = extractRawText(children)

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(rawCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard unavailable
    }
  }, [rawCode])

  return (
    <div className="relative my-2 rounded-lg border border-[#1e2035] bg-[#0d0f17] overflow-hidden">
      {/* Header bar — always visible */}
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

      {/* Highlighted code — children have hljs-* spans from rehype-highlight */}
      <pre className="m-0 overflow-x-auto p-3 font-mono text-[0.8125rem] leading-relaxed">
        <code className="hljs">{children}</code>
      </pre>
    </div>
  )
}

function extractRawText(node: React.ReactNode): string {
  if (typeof node === 'string') return node
  if (typeof node === 'number' || typeof node === 'boolean') return String(node)
  if (Array.isArray(node)) return node.map(extractRawText).join('')
  if (node && typeof node === 'object' && 'props' in node) {
    const props = (node as { props: Record<string, unknown> }).props
    if (props.children) return extractRawText(props.children as React.ReactNode)
  }
  return ''
}
