import type { Message } from '../types'

/**
 * 聊天 API 的统一入口。
 *
 * 现在用的是本地模拟回复 (mockStream)，界面可以完整跑起来。
 * 以后接真实接口时，只需要替换 streamChat 的实现：
 * 每收到一段文本就调用 onDelta(text)，结束时 resolve，
 * 并在 signal 被 abort 时尽快停止。界面其余部分不用改。
 */
export interface StreamChatOptions {
  messages: Pick<Message, 'role' | 'content'>[]
  signal: AbortSignal
  onDelta: (text: string) => void
}

export async function streamChat(options: StreamChatOptions): Promise<void> {
  return mockStream(options)
}

// ---------------- 以下为模拟实现 ----------------

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
    '目前还没有接入真实的 AI 接口，所以我只能先演示界面效果。界面已经支持：',
    '',
    '- 流式输出（一个字一个字地出现）',
    '- 随时点击「停止」中断生成',
    '- 多个会话，并自动保存在浏览器里',
    '- `行内代码` 和代码块显示',
    '',
    '```ts',
    '// 接入 API 时，只需要改 src/api/chat.ts 里的 streamChat',
    'export async function streamChat({ messages, signal, onDelta }) {',
    '  // 调用你的接口，每收到一段文字就 onDelta(text)',
    '}',
    '```',
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
