import type { LanguageModel } from 'ai'
import type { ProviderConfig } from './types'

import { createOpenAI } from '@ai-sdk/openai'
import { createAnthropic } from '@ai-sdk/anthropic'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { createGroq } from '@ai-sdk/groq'
import { createMistral } from '@ai-sdk/mistral'
import { createDeepSeek } from '@ai-sdk/deepseek'
import { createXai } from '@ai-sdk/xai'
import { createPerplexity } from '@ai-sdk/perplexity'
import { createCohere } from '@ai-sdk/cohere'
import { createTogetherAI } from '@ai-sdk/togetherai'
import { createFireworks } from '@ai-sdk/fireworks'
import { createCerebras } from '@ai-sdk/cerebras'
import { createAmazonBedrock } from '@ai-sdk/amazon-bedrock'
import { createAzure } from '@ai-sdk/azure'

export function createModel(config: ProviderConfig): LanguageModel {
  const { providerId, apiKey, model, extra } = config

  switch (providerId) {
    case 'openai': {
      const openai = createOpenAI({ apiKey })
      return openai(model)
    }

    case 'anthropic': {
      const anthropic = createAnthropic({ apiKey })
      return anthropic(model)
    }

    case 'google': {
      const google = createGoogleGenerativeAI({ apiKey })
      return google(model)
    }

    case 'groq': {
      const groq = createGroq({ apiKey })
      return groq(model)
    }

    case 'mistral': {
      const mistral = createMistral({ apiKey })
      return mistral(model)
    }

    case 'deepseek': {
      const deepseek = createDeepSeek({ apiKey })
      return deepseek(model)
    }

    case 'xai': {
      const xai = createXai({ apiKey })
      return xai(model)
    }

    case 'perplexity': {
      const perplexity = createPerplexity({ apiKey })
      return perplexity(model)
    }

    case 'cohere': {
      const cohere = createCohere({ apiKey })
      return cohere(model)
    }

    case 'togetherai': {
      const togetherai = createTogetherAI({ apiKey })
      return togetherai(model)
    }

    case 'fireworks': {
      const fireworks = createFireworks({ apiKey })
      return fireworks(model)
    }

    case 'cerebras': {
      const cerebras = createCerebras({ apiKey })
      return cerebras(model)
    }

    case 'bedrock': {
      const bedrock = createAmazonBedrock({
        accessKeyId: apiKey,
        secretAccessKey: extra?.secretKey ?? '',
        region: extra?.region ?? 'us-east-1',
      })
      return bedrock(model)
    }

    case 'azure': {
      const azure = createAzure({
        apiKey,
        resourceName: extra?.resourceName ?? '',
      })
      return azure(model)
    }

    case 'openrouter':
    case 'ollama':
    case 'lmstudio':
    case 'custom': {
      const baseUrl = config.baseUrl || ''
      const openaiCompat = createOpenAI({
        apiKey: apiKey || 'not-needed',
        baseURL: baseUrl,
      })
      return openaiCompat(model)
    }

    default:
      throw new Error(`Unknown provider: ${providerId}`)
  }
}

/**
 * Returns provider-specific options to enable reasoning/thinking.
 * Each provider has its own mechanism for controlling thinking output —
 * we set sensible defaults so reasoning chunks flow through fullStream
 * whenever the model supports it.
 */
export function getReasoningProviderOptions(providerId: string): Record<string, unknown> | undefined {
  switch (providerId) {
    // Google: Gemini 2.5+ requires thinkingConfig to emit thoughts.
    // thinkingBudget controls token allocation; includeThoughts makes
    // them visible as reasoning-delta chunks in fullStream.
    case 'google':
      return {
        google: {
          thinkingConfig: {
            thinkingBudget: 8192,
            includeThoughts: true,
          },
        },
      }

    // Anthropic: Claude models with extended thinking.
    // budgetTokens controls how many tokens the model can use for
    // internal reasoning before producing the final answer.
    case 'anthropic':
      return {
        anthropic: {
          thinking: {
            type: 'enabled',
            budgetTokens: 8192,
          },
        },
      }

    // OpenAI: reasoning models (o-series, gpt-5).
    // reasoningEffort controls how hard the model tries to reason.
    case 'openai':
      return {
        openai: {
          reasoningEffort: 'medium',
        },
      }

    // DeepSeek: R1 reasoning model. Uses OpenAI-compatible reasoning.
    case 'deepseek':
      return {
        deepseek: {
          reasoningEffort: 'medium',
        },
      }

    // These providers forward to models that may support reasoning
    // (e.g. OpenRouter can route to Anthropic/Google models).
    // Pass through — the upstream provider handles the options.
    case 'openrouter':
    case 'bedrock':
      return undefined

    // No reasoning API for these providers (or not yet known).
    default:
      return undefined
  }
}
