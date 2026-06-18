import { useState, useCallback } from 'react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
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
      // clipboard unavailable
    }
  }, [code])

  // Map common aliases to Prism language names
  const lang = normalizeLanguage(language)

  return (
    <div className="relative my-2 rounded-lg border border-[#1e2035] overflow-hidden">
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

      {/* Syntax highlighted code */}
      <SyntaxHighlighter
        language={lang}
        style={oneDark}
        customStyle={{
          margin: 0,
          padding: '0.75rem 1rem',
          background: '#0d0f17',
          fontSize: '0.8125rem',
          lineHeight: 1.55,
          borderRadius: 0,
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

function normalizeLanguage(lang: string): string {
  const aliases: Record<string, string> = {
    py: 'python',
    js: 'javascript',
    ts: 'typescript',
    jsx: 'jsx',
    tsx: 'tsx',
    rb: 'ruby',
    yml: 'yaml',
    sh: 'bash',
    zsh: 'bash',
    kt: 'kotlin',
    kts: 'kotlin',
    txt: 'text',
    text: 'text',
    plaintext: 'text',
    '': 'text',
  }
  return aliases[lang] || lang
}
