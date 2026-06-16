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
