import { useState } from 'react'
import { PROVIDERS, getProvider } from '../providers'
import type { ProviderConfig, ProviderModel } from '../providers/types'
import { fetchModels } from '../providers/model-fetch'
import { saveLastProviderConfig } from '../chat/session-store'
import { ExternalLink, Key, Zap, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react'

interface Props {
  onConfigured: (config: ProviderConfig) => void
  initialConfig?: ProviderConfig | null
}

type FetchStatus = 'idle' | 'loading' | 'success' | 'error'

export function ProviderSetup({ onConfigured, initialConfig }: Props) {
  const [selectedProviderId, setSelectedProviderId] = useState(initialConfig?.providerId ?? '')
  const [apiKey, setApiKey] = useState(initialConfig?.apiKey ?? '')
  const [selectedModel, setSelectedModel] = useState(initialConfig?.model ?? '')
  const [extraValues, setExtraValues] = useState<Record<string, string>>(initialConfig?.extra ?? {})
  const [baseUrl, setBaseUrl] = useState(initialConfig?.baseUrl ?? '')
  const [showApiKey, setShowApiKey] = useState(false)

  // Model fetching state
  const [fetchStatus, setFetchStatus] = useState<FetchStatus>('idle')
  const [fetchedModels, setFetchedModels] = useState<ProviderModel[] | null>(null)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [customModelInput, setCustomModelInput] = useState('')

  const provider = selectedProviderId ? getProvider(selectedProviderId) : null
  const modelList = fetchedModels ?? provider?.models ?? []
  const isCustomModel = selectedModel && !modelList.find((m) => m.id === selectedModel) && selectedModel !== '__custom__'

  const handleProviderChange = (id: string) => {
    setSelectedProviderId(id)
    setSelectedModel('')
    setFetchedModels(null)
    setFetchStatus('idle')
    setFetchError(null)
    setExtraValues({})
    const p = getProvider(id)
    if (p?.defaultBaseUrl) {
      setBaseUrl(p.defaultBaseUrl)
    } else {
      setBaseUrl('')
    }
  }

  const handleFetchModels = async () => {
    const p = getProvider(selectedProviderId)
    if (!p) return

    setFetchStatus('loading')
    setFetchError(null)
    setFetchedModels(null)

    try {
      const resolvedBaseUrl = p.isOpenAICompatible ? baseUrl : undefined
      const result = await fetchModels(selectedProviderId, apiKey, resolvedBaseUrl, extraValues)

      if (result.success && result.models.length > 0) {
        setFetchedModels(result.models)
        setFetchStatus('success')
      } else if (result.success && result.models.length === 0) {
        setFetchStatus('error')
        setFetchError('No models found. Check your API key and permissions.')
      } else {
        setFetchStatus('error')
        setFetchError(result.error ?? 'Failed to fetch models')
      }
    } catch (err: unknown) {
      setFetchStatus('error')
      setFetchError(err instanceof Error ? err.message : 'Connection failed')
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const p = getProvider(selectedProviderId)
    if (!p) return

    let model = selectedModel
    if (model === '__custom__') {
      model = customModelInput
    }
    if (!model) {
      model = modelList[0]?.id ?? ''
    }

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
    if (!selectedModel && !customModelInput && modelList.length === 0) return false
    if (selectedModel === '__custom__' && !customModelInput.trim()) return false
    return true
  }

  const canFetch = (): boolean => {
    if (!selectedProviderId) return false
    const p = getProvider(selectedProviderId)
    if (!p) return false
    if (p.requiresApiKey && !apiKey.trim()) return false
    return true
  }

  return (
    <div className="flex h-full items-center justify-center bg-[#0a0b10] p-6">
      <div className="w-full max-w-lg animate-[doodle-pop_0.35s_cubic-bezier(0.34,1.56,0.64,1)]">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-[10px] bg-[#6366f1]/10 shadow-[0_0_20px_rgba(99,102,241,0.15)]">
            <Zap className="h-6 w-6 text-[#6366f1]" />
          </div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-[#eeeff5]">
            BrowserSnip Chat
          </h1>
          <p className="mt-2 text-sm text-[#a8adc4]">
            Configure your AI provider to get started
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="doodle-section space-y-5 !rounded-[10px]"
        >
          {/* Provider Select */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#a8adc4]">
              Provider
            </label>
            <select
              value={selectedProviderId}
              onChange={(e) => handleProviderChange(e.target.value)}
              className="doodle-select"
            >
              <option value="">Select a provider…</option>
              {PROVIDERS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* API Key */}
          {provider && (provider.requiresApiKey || provider.id === 'custom') && (
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-sm font-medium text-[#a8adc4]">
                  {provider.apiKeyLabel}
                </label>
                {provider.apiKeyHelpUrl && (
                  <a
                    href={provider.apiKeyHelpUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-[#818cf8] hover:underline"
                  >
                    Get key <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
              <div className="relative">
                <Key className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5c6080]" />
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={provider.id === 'custom' ? 'Optional' : 'sk-…'}
                  className="doodle-input pl-10 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#5c6080] hover:text-[#a8adc4]"
                >
                  {showApiKey ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>
          )}

          {/* Extra fields (Bedrock, Azure, custom base URL) */}
          {provider?.extraFields?.map((field) => (
            <div key={field.name}>
              <label className="mb-1.5 block text-sm font-medium text-[#a8adc4]">
                {field.label}
              </label>
              <input
                type={field.type}
                value={extraValues[field.name] ?? ''}
                onChange={(e) => setExtraValues((prev) => ({ ...prev, [field.name]: e.target.value }))}
                placeholder={field.placeholder}
                className="doodle-input"
              />
              {field.helpText && (
                <p className="mt-1 text-xs text-[#5c6080]">{field.helpText}</p>
              )}
            </div>
          ))}

          {/* Base URL for OpenAI-compatible providers */}
          {provider?.isOpenAICompatible && provider.id !== 'openrouter' && provider.id !== 'ollama' && provider.id !== 'lmstudio' && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[#a8adc4]">
                Base URL
              </label>
              <input
                type="url"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder="https://api.example.com/v1"
                className="doodle-input"
              />
            </div>
          )}

          {/* Fetch Models Button */}
          {provider && (
            <div>
              <button
                type="button"
                onClick={handleFetchModels}
                disabled={!canFetch() || fetchStatus === 'loading'}
                className="doodle-btn-secondary flex items-center justify-center gap-2"
              >
                {fetchStatus === 'loading' ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Fetching models…
                  </>
                ) : fetchStatus === 'success' ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-[#34d399]" />
                    Models loaded ({fetchedModels!.length} available)
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4" />
                    Fetch Available Models
                  </>
                )}
              </button>

              {/* Fetch error */}
              {fetchStatus === 'error' && fetchError && (
                <div className="mt-2 flex items-start gap-2 rounded-[6px] border border-[#f87171]/20 bg-[#f87171]/10 px-3 py-2">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#f87171]" />
                  <p className="text-xs text-[#f87171]">{fetchError}</p>
                </div>
              )}

              {/* Fetch success with fallback indicator */}
              {fetchStatus === 'success' && fetchedModels && (
                <p className="mt-1.5 text-xs text-[#34d399]">
                  Connection verified — API key is working
                </p>
              )}

              {/* Idle hint */}
              {fetchStatus === 'idle' && canFetch() && (
                <p className="mt-1.5 text-xs text-[#5c6080]">
                  Click to verify your API key and load available models
                </p>
              )}
            </div>
          )}

          {/* Model Select (appears after fetching, or uses static list) */}
          {provider && modelList.length > 0 && (
            <div className="animate-[fade-in_0.3s_ease-out]">
              <label className="mb-1.5 block text-sm font-medium text-[#a8adc4]">
                Model {fetchedModels ? '(from API)' : '(built-in list)'}
              </label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="doodle-select"
              >
                <option value="">Choose a model…</option>
                {modelList.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
                <option value="__custom__">Custom model name…</option>
              </select>

              {selectedModel === '__custom__' && (
                <input
                  type="text"
                  value={customModelInput}
                  onChange={(e) => setCustomModelInput(e.target.value)}
                  placeholder="Enter model name…"
                  className="doodle-input mt-2"
                  autoFocus
                />
              )}

              {isCustomModel && (
                <p className="mt-1 text-xs text-[#5c6080]">
                  Using custom model:{' '}
                  <code className="rounded bg-[#161922] px-1 py-0.5 text-[#a5b4fc]">
                    {selectedModel}
                  </code>
                </p>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={!isValid()}
            className="doodle-btn"
          >
            Start Chatting
          </button>
        </form>
      </div>
    </div>
  )
}
