/**
 * API 设置。保存在当前浏览器的 localStorage 里，不会上传到任何地方
 * （只会随请求发给你填写的 Base URL）。
 *
 * 可以用 .env 里的 VITE_API_BASE_URL / VITE_MODEL 提供默认值。
 */
export interface ApiSettings {
  baseUrl: string
  apiKey: string
  model: string
  systemPrompt: string
}

const KEY = 'ai-chat:settings'

export const DEFAULT_SETTINGS: ApiSettings = {
  baseUrl: import.meta.env.VITE_API_BASE_URL ?? 'https://api.openai.com/v1',
  apiKey: '',
  model: import.meta.env.VITE_MODEL ?? 'gpt-4o-mini',
  systemPrompt: '',
}

export function loadSettings(): ApiSettings {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS
  } catch {
    return DEFAULT_SETTINGS
  }
}

export function saveSettings(s: ApiSettings) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s))
  } catch {
    /* 存储不可用时忽略 */
  }
}

/** 填了 API Key 才走真实接口，否则使用模拟回复 */
export function isConfigured(s: ApiSettings) {
  return Boolean(s.apiKey.trim() && s.baseUrl.trim() && s.model.trim())
}
