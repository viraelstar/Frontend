import { useCallback, useEffect, useRef, useState } from 'react'
import type { Conversation, Message } from '../types'
import { streamChat } from '../api/chat'

const STORAGE_KEY = 'ai-chat:conversations'

export const uid = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 8)

function load(): Conversation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Conversation[]) : []
  } catch {
    return []
  }
}

function save(list: Conversation[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  } catch {
    /* 存储不可用时忽略 */
  }
}

function titleFrom(text: string) {
  const t = text.replace(/\s+/g, ' ').trim()
  return t.length > 24 ? t.slice(0, 24) + '…' : t || '新对话'
}

export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>(load)
  const [activeId, setActiveId] = useState<string | null>(
    () => conversations[0]?.id ?? null,
  )
  const [streamingId, setStreamingId] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => save(conversations), [conversations])

  const active = conversations.find((c) => c.id === activeId) ?? null

  const updateConv = useCallback(
    (id: string, fn: (c: Conversation) => Conversation) =>
      setConversations((list) => list.map((c) => (c.id === id ? fn(c) : c))),
    [],
  )

  const newChat = useCallback(() => {
    abortRef.current?.abort()
    setActiveId(null)
  }, [])

  const select = useCallback((id: string) => setActiveId(id), [])

  const remove = useCallback(
    (id: string) => {
      if (streamingId && active?.id === id) abortRef.current?.abort()
      setConversations((list) => list.filter((c) => c.id !== id))
      setActiveId((cur) => (cur === id ? null : cur))
    },
    [streamingId, active?.id],
  )

  const stop = useCallback(() => abortRef.current?.abort(), [])

  const runAssistant = useCallback(
    async (convId: string, history: Message[]) => {
      const assistant: Message = {
        id: uid(),
        role: 'assistant',
        content: '',
        createdAt: Date.now(),
      }
      updateConv(convId, (c) => ({
        ...c,
        messages: [...history, assistant],
        updatedAt: Date.now(),
      }))

      const controller = new AbortController()
      abortRef.current = controller
      setStreamingId(assistant.id)

      const patch = (fn: (m: Message) => Message) =>
        updateConv(convId, (c) => ({
          ...c,
          messages: c.messages.map((m) => (m.id === assistant.id ? fn(m) : m)),
        }))

      let thinkStart: number | null = null

      try {
        await streamChat({
          messages: history
            .filter((m) => !m.error && m.content.trim())
            .map(({ role, content }) => ({ role, content })),
          signal: controller.signal,
          onDelta: ({ content, reasoning }) => {
            if (!content && !reasoning) return
            if (reasoning && thinkStart === null) thinkStart = Date.now()
            patch((m) => {
              const next = { ...m }
              if (reasoning) next.reasoning = (m.reasoning ?? '') + reasoning
              if (content) {
                // 思考结束、开始回答：记录思考用时，并去掉开头多余的换行
                if (thinkStart !== null && next.reasoningMs === undefined)
                  next.reasoningMs = Date.now() - thinkStart
                const add = m.content ? content : content.trimStart()
                next.content = m.content + add
              }
              return next
            })
          },
        })
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          patch((m) => ({
            ...m,
            error: true,
            content: m.content || `出错了：${(err as Error).message}`,
          }))
        }
      } finally {
        // 只有思考、没有回答（比如被中途停止）时也记录用时
        if (thinkStart !== null) {
          const start = thinkStart
          patch((m) =>
            m.reasoningMs === undefined ? { ...m, reasoningMs: Date.now() - start } : m,
          )
        }
        if (abortRef.current === controller) abortRef.current = null
        setStreamingId(null)
      }
    },
    [updateConv],
  )

  const send = useCallback(
    (text: string) => {
      const content = text.trim()
      if (!content || streamingId) return
      const userMsg: Message = {
        id: uid(),
        role: 'user',
        content,
        createdAt: Date.now(),
      }

      let convId = active?.id
      let history: Message[]
      if (!convId) {
        convId = uid()
        history = [userMsg]
        const conv: Conversation = {
          id: convId,
          title: titleFrom(content),
          messages: history,
          updatedAt: Date.now(),
        }
        setConversations((list) => [conv, ...list])
        setActiveId(convId)
      } else {
        history = [...active!.messages, userMsg]
      }
      void runAssistant(convId, history)
    },
    [active, streamingId, runAssistant],
  )

  /** 重新生成最后一条助手回复 */
  const regenerate = useCallback(() => {
    if (!active || streamingId) return
    const msgs = [...active.messages]
    while (msgs.length && msgs[msgs.length - 1].role === 'assistant') msgs.pop()
    if (!msgs.length) return
    void runAssistant(active.id, msgs)
  }, [active, streamingId, runAssistant])

  // 会话按最近更新时间排序
  const sorted = [...conversations].sort((a, b) => b.updatedAt - a.updatedAt)

  return {
    conversations: sorted,
    active,
    streamingId,
    newChat,
    select,
    remove,
    send,
    stop,
    regenerate,
  }
}
