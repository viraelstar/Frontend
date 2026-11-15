import { useEffect, useRef, useState } from 'react'
import type { Message } from '../types'
import { Markdown } from './Markdown'
import { IconCopy, IconRefresh } from './icons'

interface Props {
  messages: Message[]
  streamingId: string | null
  onRegenerate: () => void
}

function CopyButton({ text }: { text: string }) {
  const [done, setDone] = useState(false)
  return (
    <button
      type="button"
      className="msg-action"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text)
          setDone(true)
          setTimeout(() => setDone(false), 1500)
        } catch {
          /* 剪贴板不可用 */
        }
      }}
    >
      <IconCopy />
      {done ? '已复制' : '复制'}
    </button>
  )
}

export function MessageList({ messages, streamingId, onRegenerate }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const stickRef = useRef(true)

  // 用户在底部附近时自动跟随滚动；往上翻看时不打扰
  const onScroll = () => {
    const el = scrollRef.current
    if (!el) return
    stickRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80
  }

  useEffect(() => {
    const el = scrollRef.current
    if (el && stickRef.current) el.scrollTop = el.scrollHeight
  }, [messages])

  const lastAssistantId = [...messages].reverse().find((m) => m.role === 'assistant')?.id

  return (
    <div className="messages" ref={scrollRef} onScroll={onScroll}>
      <div className="messages-inner">
        {messages.map((m) => {
          const streaming = m.id === streamingId
          if (m.role === 'user') {
            return (
              <div key={m.id} className="msg msg-user">
                <div className="bubble">{m.content}</div>
              </div>
            )
          }
          return (
            <div key={m.id} className={`msg msg-assistant ${m.error ? 'error' : ''}`}>
              {m.content ? (
                <Markdown text={m.content} />
              ) : (
                <div className="typing" aria-label="正在思考">
                  <span />
                  <span />
                  <span />
                </div>
              )}
              {!streaming && m.content && (
                <div className="msg-actions">
                  <CopyButton text={m.content} />
                  {m.id === lastAssistantId && !streamingId && (
                    <button type="button" className="msg-action" onClick={onRegenerate}>
                      <IconRefresh />
                      重新生成
                    </button>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
