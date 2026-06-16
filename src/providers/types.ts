import type { LanguageModel } from 'ai'

export interface ProviderModel {
  id: string
  name: string
}

export interface ProviderDef {
  id: string
  name: string
  requiresApiKey: boolean
  apiKeyLabel: string
  apiKeyHelpUrl: string
  models: ProviderModel[]
  extraFields?: ProviderExtraField[]
  isOpenAICompatible?: boolean
  defaultBaseUrl?: string
}

export interface ProviderExtraField {
  name: string
  label: string
  type: 'text' | 'url'
  placeholder: string
  helpText?: string
}

export interface ProviderConfig {
  providerId: string
  apiKey: string
  model: string
  baseUrl?: string
  extra?: Record<string, string>
}

export type ProviderFactory = (config: ProviderConfig) => LanguageModel
