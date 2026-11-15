import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { IconSend, IconStop } from './icons'

interface Props {
  streaming: boolean
  onSend: (text: string) => void
  onStop: () => void
  autoFocusKey?: string | null
}

// 触屏设备上没有 Shift+Enter 的概念，提示文字简化
const isTouch =
  typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches

export function Composer({ streaming, onSend, onStop, autoFocusKey }: Props) {
  const [text, setText] = useState('')
  const ref = useRef<HTMLTextAreaElement>(null)
  const formRef = useRef<HTMLFormElement>(null)

  // 输入框浮在消息上方：把它的高度告诉父元素，消息列表据此留出底部空间
  useEffect(() => {
    const form = formRef.current
    const host = form?.parentElement
    if (!form || !host) return
    const ro = new ResizeObserver(() =>
      host.style.setProperty('--composer-h', `${form.offsetHeight}px`),
    )
    ro.observe(form)
    return () => ro.disconnect()
  }, [])

  // 自动调整高度
  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 200) + 'px'
  }, [text])

  useEffect(() => {
    ref.current?.focus()
  }, [autoFocusKey])

  const submit = () => {
    if (!text.trim() || streaming) return
    onSend(text)
    setText('')
  }

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter 发送，Shift+Enter 换行；输入法组字时不发送
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      submit()
    }
  }

  return (
    <form
      ref={formRef}
      className="composer"
      onSubmit={(e) => {
        e.preventDefault()
        submit()
      }}
    >
      <div className="composer-box glass">
        <textarea
          ref={ref}
          rows={1}
          value={text}
          placeholder={isTouch ? '输入消息' : '输入消息，Enter 发送，Shift + Enter 换行'}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKeyDown}
          aria-label="消息输入框"
        />
        {streaming ? (
          <button type="button" className="send-btn" onClick={onStop} aria-label="停止生成">
            <IconStop />
          </button>
        ) : (
          <button
            type="submit"
            className="send-btn"
            disabled={!text.trim()}
            aria-label="发送"
          >
            <IconSend />
          </button>
        )}
      </div>
      <p className="composer-hint">AI 可能会出错，请核实重要信息。</p>
    </form>
  )
}
