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
    <div className="group relative my-2">
      {/* Copy button — visible on hover */}
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 z-10 flex items-center gap-1.5 rounded-md bg-[#1e2035]/90 px-2 py-1 text-[11px] text-[#a8adc4] opacity-0 transition-opacity hover:bg-[#2a2d42] group-hover:opacity-100 backdrop-blur-sm"
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

      {/* Language label — visible on hover */}
      <span className="absolute bottom-2 right-2 z-10 rounded-md bg-[#1e2035]/80 px-1.5 py-0.5 font-mono text-[10px] text-[#5c6080] opacity-0 transition-opacity group-hover:opacity-100 backdrop-blur-sm uppercase">
        {language}
      </span>

      {/* Code — children already highlighted by rehype-highlight */}
      <pre className="m-0 overflow-x-auto rounded-lg border border-[#1e2035] bg-[#0d0f17] p-3 font-mono text-[0.8125rem] leading-relaxed">
        <code>{children}</code>
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
