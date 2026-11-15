import type { Message } from '../types'
import { isConfigured, loadSettings, type ApiSettings } from '../settings'

/**
 * 聊天 API 的统一入口。
 * 每收到一段文本就调用 onDelta(text)，结束时 resolve，signal 中止时停止。
 *
 * - 设置里填了 API Key：调用 OpenAI 兼容的 /chat/completions（流式）
 * - 没填：使用本地模拟回复，方便先看界面
 */
export interface StreamChatOptions {
  messages: Pick<Message, 'role' | 'content'>[]
  signal: AbortSignal
  onDelta: (text: string) => void
}

export async function streamChat(options: StreamChatOptions): Promise<void> {
  const settings = loadSettings()
  if (isConfigured(settings)) return openAIStream(settings, options)
  return mockStream(options)
}

// ---------------- OpenAI 兼容接口 ----------------

function endpoint(baseUrl: string) {
  const base = baseUrl.trim().replace(/\/+$/, '')
  return base.endsWith('/chat/completions') ? base : `${base}/chat/completions`
}

async function readError(res: Response): Promise<string> {
  const text = await res.text().catch(() => '')
  try {
    const data = JSON.parse(text)
    const msg = data?.error?.message ?? data?.message ?? data?.error
    if (msg) return `${res.status} ${typeof msg === 'string' ? msg : JSON.stringify(msg)}`
  } catch {
    /* 不是 JSON */
  }
  return `${res.status} ${text.slice(0, 200) || res.statusText}`
}

async function openAIStream(
  settings: ApiSettings,
  { messages, signal, onDelta }: StreamChatOptions,
) {
  const payloadMessages = [
    ...(settings.systemPrompt.trim()
      ? [{ role: 'system', content: settings.systemPrompt.trim() }]
      : []),
    ...messages,
  ]

  let res: Response
  try {
    res = await fetch(endpoint(settings.baseUrl), {
      method: 'POST',
      signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${settings.apiKey.trim()}`,
      },
      body: JSON.stringify({
        model: settings.model.trim(),
        messages: payloadMessages,
        stream: true,
      }),
    })
  } catch (err) {
    if ((err as Error).name === 'AbortError') throw err
    throw new Error(
      '网络请求失败。请检查 Base URL 是否正确，或者该服务是否允许浏览器跨域 (CORS) 访问。',
    )
  }

  if (!res.ok) throw new Error(await readError(res))

  // 部分服务即使 stream: true 也可能直接返回 JSON
  const type = res.headers.get('content-type') ?? ''
  if (!res.body || type.includes('application/json')) {
    const data = await res.json()
    const text = data?.choices?.[0]?.message?.content
    if (typeof text === 'string') onDelta(text)
    return
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  const handleLine = (line: string): boolean => {
    const trimmed = line.trim()
    if (!trimmed.startsWith('data:')) return false
    const data = trimmed.slice(5).trim()
    if (data === '[DONE]') return true
    try {
      const json = JSON.parse(data)
      if (json.error) throw new Error(json.error.message ?? JSON.stringify(json.error))
      const delta = json.choices?.[0]?.delta?.content
      if (typeof delta === 'string' && delta) onDelta(delta)
    } catch (err) {
      if (err instanceof SyntaxError) return false // 不完整或非 JSON 的行，跳过
      throw err
    }
    return false
  }

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''
      for (const line of lines) if (handleLine(line)) return
    }
    buffer += decoder.decode()
    if (buffer) handleLine(buffer)
  } finally {
    reader.cancel().catch(() => {})
  }
}

// ---------------- 模拟实现（未配置 API 时使用） ----------------

function sleep(ms: number, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal.aborted) return reject(new DOMException('Aborted', 'AbortError'))
    const t = setTimeout(resolve, ms)
    signal.addEventListener(
      'abort',
      () => {
        clearTimeout(t)
        reject(new DOMException('Aborted', 'AbortError'))
      },
      { once: true },
    )
  })
}

function buildMockReply(question: string): string {
  const q = question.trim()
  return [
    `这是一条**模拟回复**，你刚才说的是：「${q.length > 60 ? q.slice(0, 60) + '…' : q}」`,
    '',
    '还没有配置 API，所以先用模拟回复演示界面。要接入真实的 AI：',
    '',
    '1. 点击左下角的 **API 设置**',
    '2. 填写 Base URL（例如 `https://api.openai.com/v1`）',
    '3. 填写 API Key 和模型名称，保存即可',
    '',
    '支持任何 OpenAI 兼容接口，比如 OpenAI、DeepSeek、通义千问、Ollama 等。',
  ].join('\n')
}

async function mockStream({ messages, signal, onDelta }: StreamChatOptions) {
  const last = [...messages].reverse().find((m) => m.role === 'user')
  const reply = buildMockReply(last?.content ?? '')
  await sleep(400, signal)
  let i = 0
  while (i < reply.length) {
    const step = 1 + Math.floor(Math.random() * 4)
    onDelta(reply.slice(i, i + step))
    i += step
    await sleep(18 + Math.random() * 30, signal)
  }
}
