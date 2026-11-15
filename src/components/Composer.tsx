import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { IconSend, IconStop } from './icons'

interface Props {
  streaming: boolean
  onSend: (text: string) => void
  onStop: () => void
  autoFocusKey?: string | null
}

export function Composer({ streaming, onSend, onStop, autoFocusKey }: Props) {
  const [text, setText] = useState('')
  const ref = useRef<HTMLTextAreaElement>(null)

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
      className="composer"
      onSubmit={(e) => {
        e.preventDefault()
        submit()
      }}
    >
      <div className="composer-box">
        <textarea
          ref={ref}
          rows={1}
          value={text}
          placeholder="输入消息，Enter 发送，Shift + Enter 换行"
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
