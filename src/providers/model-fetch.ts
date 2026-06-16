import type { ProviderModel } from './types'

export interface FetchModelsResult {
  success: boolean
  models: ProviderModel[]
  error?: string
}

interface FetchStrategy {
  endpoint: string
  headers: Record<string, string>
  parseResponse: (data: unknown) => ProviderModel[]
}

/**
 * Builds the fetch strategy for each provider.
 */
function getFetchStrategy(
  providerId: string,
  apiKey: string,
  baseUrl?: string,
  extra?: Record<string, string>,
): FetchStrategy | null {
  switch (providerId) {
    // ── OpenAI ──
    case 'openai':
      return {
        endpoint: 'https://api.openai.com/v1/models',
        headers: { Authorization: `Bearer ${apiKey}` },
        parseResponse: parseOpenAIList,
      }

    // ── Anthropic — no models endpoint; validate key via a minimal message ──
    case 'anthropic':
      return {
        endpoint: 'https://api.anthropic.com/v1/messages',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
        parseResponse: () => [], // Returns empty — static list used
      }

    // ── Google AI ──
    case 'google':
      return {
        endpoint: `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
        headers: {},
        parseResponse: parseGoogleList,
      }

    // ── Groq (OpenAI-compatible) ──
    case 'groq':
      return {
        endpoint: 'https://api.groq.com/openai/v1/models',
        headers: { Authorization: `Bearer ${apiKey}` },
        parseResponse: parseOpenAIList,
      }

    // ── Mistral ──
    case 'mistral':
      return {
        endpoint: 'https://api.mistral.ai/v1/models',
        headers: { Authorization: `Bearer ${apiKey}` },
        parseResponse: parseOpenAIList,
      }

    // ── DeepSeek ──
    case 'deepseek':
      return {
        endpoint: 'https://api.deepseek.com/v1/models',
        headers: { Authorization: `Bearer ${apiKey}` },
        parseResponse: parseOpenAIList,
      }

    // ── xAI ──
    case 'xai':
      return {
        endpoint: 'https://api.x.ai/v1/models',
        headers: { Authorization: `Bearer ${apiKey}` },
        parseResponse: parseOpenAIList,
      }

    // ── Perplexity ──
    case 'perplexity':
      return {
        endpoint: 'https://api.perplexity.ai/models',
        headers: { Authorization: `Bearer ${apiKey}` },
        parseResponse: parseOpenAIList,
      }

    // ── Cohere ──
    case 'cohere':
      return {
        endpoint: 'https://api.cohere.com/v1/models',
        headers: { Authorization: `Bearer ${apiKey}` },
        parseResponse: parseCohereList,
      }

    // ── Together AI ──
    case 'togetherai':
      return {
        endpoint: 'https://api.together.xyz/v1/models',
        headers: { Authorization: `Bearer ${apiKey}` },
        parseResponse: parseOpenAIList,
      }

    // ── Fireworks ──
    case 'fireworks':
      return {
        endpoint: 'https://api.fireworks.ai/inference/v1/models',
        headers: { Authorization: `Bearer ${apiKey}` },
        parseResponse: parseOpenAIList,
      }

    // ── Cerebras ──
    case 'cerebras':
      return {
        endpoint: 'https://api.cerebras.ai/v1/models',
        headers: { Authorization: `Bearer ${apiKey}` },
        parseResponse: parseOpenAIList,
      }

    // ── Bedrock — no HTTP endpoint, skip ──
    case 'bedrock':
      return null

    // ── Azure ──
    case 'azure': {
      const resourceName = extra?.resourceName ?? ''
      if (!resourceName) return null
      return {
        endpoint: `https://${resourceName}.openai.azure.com/openai/models?api-version=2024-10-21`,
        headers: { 'api-key': apiKey },
        parseResponse: parseAzureList,
      }
    }

    // ── OpenRouter ──
    case 'openrouter':
      return {
        endpoint: 'https://openrouter.ai/api/v1/models',
        headers: { Authorization: `Bearer ${apiKey}` },
        parseResponse: parseOpenAIList,
      }

    // ── Ollama (local) ──
    case 'ollama': {
      const base = baseUrl || 'http://localhost:11434'
      return {
        endpoint: `${base.replace(/\/v1$/, '')}/api/tags`,
        headers: {},
        parseResponse: parseOllamaList,
      }
    }

    // ── LM Studio (local) ──
    case 'lmstudio': {
      const base = baseUrl || 'http://localhost:1234/v1'
      return {
        endpoint: `${base.replace(/\/v1$/, '')}/v1/models`,
        headers: {},
        parseResponse: parseOpenAIList,
      }
    }

    // ── Custom OpenAI-compatible ──
    case 'custom': {
      const base = baseUrl || ''
      if (!base) return null
      return {
        endpoint: `${base.replace(/\/$/, '')}/models`,
        headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : {},
        parseResponse: parseOpenAIList,
      }
    }

    default:
      return null
  }
}

/**
 * Fetches available models from the provider and validates the API key.
 * Falls back to static model list on failure.
 */
export async function fetchModels(
  providerId: string,
  apiKey: string,
  baseUrl?: string,
  extra?: Record<string, string>,
): Promise<FetchModelsResult> {
  const strategy = getFetchStrategy(providerId, apiKey, baseUrl, extra)

  if (!strategy) {
    return {
      success: false,
      models: [],
      error: 'Model fetching is not available for this provider. Use the built-in model list.',
    }
  }

  try {
    const isAnthropic = providerId === 'anthropic'

    const fetchOptions: RequestInit = {
      method: isAnthropic ? 'POST' : 'GET',
      headers: strategy.headers,
      signal: AbortSignal.timeout(15000),
    }

    // Anthropic: send a minimal message to validate the key
    if (isAnthropic) {
      fetchOptions.body = JSON.stringify({
        model: 'claude-haiku-4-5',
        max_tokens: 1,
        messages: [{ role: 'user', content: 'hi' }],
      })
    }

    const response = await fetch(strategy.endpoint, fetchOptions)

    if (!response.ok) {
      const errorText = await response.text().catch(() => '')
      let errorMsg = `HTTP ${response.status}`

      if (response.status === 401 || response.status === 403) {
        errorMsg = 'Invalid API key — please check and try again'
      } else if (response.status === 404) {
        errorMsg = 'Endpoint not found — the provider may not support model listing'
      } else if (response.status === 429) {
        errorMsg = 'Rate limited — please wait and try again'
      } else if (errorText) {
        try {
          const parsed = JSON.parse(errorText)
          errorMsg = parsed.error?.message || parsed.message || errorMsg
        } catch {
          errorMsg = errorText.slice(0, 200)
        }
      }

      return { success: false, models: [], error: errorMsg }
    }

    const data = await response.json()

    // For Anthropic, a successful response means the key is valid but we have no model list
    if (isAnthropic) {
      return { success: true, models: [] }
    }

    const models = strategy.parseResponse(data)
    return { success: true, models }
  } catch (err: unknown) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      return { success: false, models: [], error: 'Request timed out — check your connection' }
    }

    // Network error / CORS
    const message = err instanceof Error ? err.message : 'Unknown error'
    if (message.includes('Failed to fetch') || message.includes('NetworkError')) {
      return {
        success: false,
        models: [],
        error:
          'Cannot reach the provider. This may be due to CORS restrictions in the browser. Some providers do not allow direct browser access.',
      }
    }

    return { success: false, models: [], error: message }
  }
}

// ── Response parsers ──

function parseOpenAIList(data: unknown): ProviderModel[] {
  const obj = data as Record<string, unknown>
  const items = obj?.data as Array<Record<string, unknown>> | undefined
  if (!items || !Array.isArray(items)) return []
  return items
    .filter((m) => m?.id && typeof m.id === 'string')
    .map((m) => ({
      id: m.id as string,
      name: (m.id as string).replace(/^accounts\/[^/]+\/models\//, ''),
    }))
    .sort((a, b) => a.id.localeCompare(b.id))
}

function parseGoogleList(data: unknown): ProviderModel[] {
  const obj = data as Record<string, unknown>
  const items = obj?.models as Array<Record<string, unknown>> | undefined
  if (!items || !Array.isArray(items)) return []
  return items
    .filter(
      (m) =>
        m?.name &&
        typeof m.name === 'string' &&
        (m.name as string).includes('gemini') &&
        (m as Record<string, unknown>)?.supportedGenerationMethods,
    )
    .map((m) => {
      const name = (m.name as string).replace(/^models\//, '')
      const display = (m as Record<string, unknown>)?.displayName
      return {
        id: name,
        name: typeof display === 'string' ? display : name,
      }
    })
    .sort((a, b) => a.id.localeCompare(b.id))
}

function parseCohereList(data: unknown): ProviderModel[] {
  const obj = data as Record<string, unknown>
  const items = obj?.models as Array<Record<string, unknown>> | undefined
  if (!items || !Array.isArray(items)) return []
  return items
    .filter((m) => m?.name && typeof m.name === 'string' && m?.endpoints)
    .map((m) => ({
      id: m.name as string,
      name: (m.name as string)
        .split('-')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' '),
    }))
}

function parseAzureList(data: unknown): ProviderModel[] {
  const obj = data as Record<string, unknown>
  const items = obj?.data as Array<Record<string, unknown>> | undefined
  if (!items || !Array.isArray(items)) return []
  return items
    .filter((m) => m?.id && typeof m.id === 'string')
    .map((m) => ({ id: m.id as string, name: m.id as string }))
    .sort((a, b) => a.id.localeCompare(b.id))
}

function parseOllamaList(data: unknown): ProviderModel[] {
  const obj = data as Record<string, unknown>
  const items = obj?.models as Array<Record<string, unknown>> | undefined
  if (!items || !Array.isArray(items)) return []
  return items
    .filter((m) => m?.name && typeof m.name === 'string')
    .map((m) => ({
      id: m.name as string,
      name: (m.name as string).replace(/:latest$/, ''),
    }))
    .sort((a, b) => a.id.localeCompare(b.id))
}
