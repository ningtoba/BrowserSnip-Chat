import { useState } from 'react'
import { PROVIDERS, getProvider } from '../providers'
import type { ProviderConfig } from '../providers/types'
import { saveLastProviderConfig } from '../chat/session-store'
import { ChevronDown, ExternalLink, Key, Zap } from 'lucide-react'

interface Props {
  onConfigured: (config: ProviderConfig) => void
  initialConfig?: ProviderConfig | null
}

export function ProviderSetup({ onConfigured, initialConfig }: Props) {
  const [selectedProviderId, setSelectedProviderId] = useState(initialConfig?.providerId ?? '')
  const [apiKey, setApiKey] = useState(initialConfig?.apiKey ?? '')
  const [selectedModel, setSelectedModel] = useState(initialConfig?.model ?? '')
  const [extraValues, setExtraValues] = useState<Record<string, string>>(initialConfig?.extra ?? {})
  const [baseUrl, setBaseUrl] = useState(initialConfig?.baseUrl ?? '')
  const [showApiKey, setShowApiKey] = useState(false)

  const provider = selectedProviderId ? getProvider(selectedProviderId) : null
  const modelList = provider?.models ?? []
  const isCustomModel = selectedModel && !modelList.find((m) => m.id === selectedModel)

  const handleProviderChange = (id: string) => {
    setSelectedProviderId(id)
    setSelectedModel('')
    setExtraValues({})
    const p = getProvider(id)
    if (p?.defaultBaseUrl) {
      setBaseUrl(p.defaultBaseUrl)
    } else {
      setBaseUrl('')
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const p = getProvider(selectedProviderId)
    if (!p) return

    const model = selectedModel || modelList[0]?.id || ''

    const config: ProviderConfig = {
      providerId: selectedProviderId,
      apiKey: p.requiresApiKey ? apiKey : (apiKey || 'not-needed'),
      model,
      extra: Object.keys(extraValues).length > 0 ? extraValues : undefined,
    }

    if (p.isOpenAICompatible && baseUrl) {
      config.baseUrl = baseUrl
    }

    saveLastProviderConfig(config)
    onConfigured(config)
  }

  const isValid = (): boolean => {
    if (!selectedProviderId) return false
    const p = getProvider(selectedProviderId)
    if (!p) return false
    if (p.requiresApiKey && !apiKey.trim()) return false
    if (!selectedModel && modelList.length === 0) return false
    return true
  }

  return (
    <div className="flex h-full items-center justify-center bg-[var(--color-surface-0)] p-6">
      <div className="w-full max-w-lg animate-fade-in">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-accent)]/10">
            <Zap className="h-6 w-6 text-[var(--color-accent)]" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-text-primary)]">
            BrowserSnip Chat
          </h1>
          <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
            Configure your AI provider to get started
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-1)] p-6"
        >
          {/* Provider Select */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--color-text-secondary)]">
              Provider
            </label>
            <div className="relative">
              <select
                value={selectedProviderId}
                onChange={(e) => handleProviderChange(e.target.value)}
                className="w-full appearance-none rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-2.5 pr-10 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
              >
                <option value="">Select a provider…</option>
                {PROVIDERS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-muted)]" />
            </div>
          </div>

          {/* Model Select / Custom Input */}
          {provider && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--color-text-secondary)]">
                Model
              </label>
              {modelList.length > 0 ? (
                <div className="relative">
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="w-full appearance-none rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-2.5 pr-10 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
                  >
                    <option value="">Choose a model…</option>
                    {modelList.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                    <option value="__custom__">Custom model name…</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-muted)]" />
                </div>
              ) : (
                <input
                  type="text"
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  placeholder="Model ID"
                  className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-2.5 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
                />
              )}
              {selectedModel === '__custom__' && (
                <input
                  type="text"
                  value=""
                  onChange={(e) => setSelectedModel(e.target.value)}
                  placeholder="Enter model name…"
                  className="mt-2 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-2.5 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
                  autoFocus
                />
              )}
              {isCustomModel && selectedModel !== '__custom__' && (
                <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                  Using custom model: <code className="rounded bg-[var(--color-surface-2)] px-1 py-0.5">{selectedModel}</code>
                </p>
              )}
            </div>
          )}

          {/* API Key */}
          {provider && (provider.requiresApiKey || provider.id === 'custom') && (
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-sm font-medium text-[var(--color-text-secondary)]">
                  {provider.apiKeyLabel}
                </label>
                {provider.apiKeyHelpUrl && (
                  <a
                    href={provider.apiKeyHelpUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-[var(--color-accent)] hover:underline"
                  >
                    Get key <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
              <div className="relative">
                <Key className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-muted)]" />
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={provider.id === 'custom' ? 'Optional' : 'sk-…'}
                  className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] py-2.5 pl-10 pr-12 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
                >
                  {showApiKey ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>
          )}

          {/* Extra fields (Bedrock, Azure, custom base URL etc.) */}
          {provider?.extraFields?.map((field) => (
            <div key={field.name}>
              <label className="mb-1.5 block text-sm font-medium text-[var(--color-text-secondary)]">
                {field.label}
              </label>
              <input
                type={field.type}
                value={extraValues[field.name] ?? ''}
                onChange={(e) => setExtraValues((prev) => ({ ...prev, [field.name]: e.target.value }))}
                placeholder={field.placeholder}
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-2.5 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
              />
              {field.helpText && (
                <p className="mt-1 text-xs text-[var(--color-text-muted)]">{field.helpText}</p>
              )}
            </div>
          ))}

          {/* Base URL for OpenAI-compatible providers */}
          {provider?.isOpenAICompatible && provider.id !== 'openrouter' && provider.id !== 'ollama' && provider.id !== 'lmstudio' && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--color-text-secondary)]">
                Base URL
              </label>
              <input
                type="url"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder="https://api.example.com/v1"
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-2.5 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={!isValid()}
            className="w-full rounded-lg bg-[var(--color-accent)] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--color-accent-strong)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Start Chatting
          </button>
        </form>
      </div>
    </div>
  )
}
