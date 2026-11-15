import { useState } from 'react'
import { Markdown } from './Markdown'
import { IconChevron } from './icons'

interface Props {
  text: string
  /** 还在思考（有思考内容，还没开始回答） */
  thinking: boolean
  durationMs?: number
}

function formatDuration(ms: number) {
  const s = Math.max(1, Math.round(ms / 1000))
  return s < 60 ? `${s} 秒` : `${Math.floor(s / 60)} 分 ${s % 60} 秒`
}

/** 可折叠的思考过程：思考时自动展开，开始回答后自动收起，用户也可以手动切换 */
export function Reasoning({ text, thinking, durationMs }: Props) {
  const [userOpen, setUserOpen] = useState<boolean | null>(null)
  const open = userOpen ?? thinking

  const label = thinking
    ? '思考中…'
    : durationMs !== undefined
      ? `已思考 ${formatDuration(durationMs)}`
      : '思考过程'

  return (
    <div className={`reasoning ${open ? 'open' : ''}`}>
      <button
        type="button"
        className={`reasoning-toggle ${thinking ? 'thinking' : ''}`}
        aria-expanded={open}
        onClick={() => setUserOpen(!open)}
      >
        <span>{label}</span>
        <IconChevron />
      </button>
      {open && (
        <div className="reasoning-body">
          <Markdown text={text} />
        </div>
      )}
    </div>
  )
}
