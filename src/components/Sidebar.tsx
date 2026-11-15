import type { Conversation } from '../types'
import { IconPlus, IconSettings, IconTrash } from './icons'

interface Props {
  conversations: Conversation[]
  activeId: string | null
  open: boolean
  onNew: () => void
  onSelect: (id: string) => void
  onDelete: (id: string) => void
  onClose: () => void
  apiLabel: string
  apiReady: boolean
  onOpenSettings: () => void
}

export function Sidebar({
  conversations,
  activeId,
  open,
  onNew,
  onSelect,
  onDelete,
  onClose,
  apiLabel,
  apiReady,
  onOpenSettings,
}: Props) {
  return (
    <>
      <div className={`scrim ${open ? 'show' : ''}`} onClick={onClose} />
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <button type="button" className="new-chat" onClick={onNew}>
          <IconPlus />
          新对话
        </button>

        <nav className="conv-list" aria-label="历史对话">
          {conversations.length === 0 ? (
            <p className="conv-empty">还没有对话</p>
          ) : (
            conversations.map((c) => (
              <div
                key={c.id}
                className={`conv-item ${c.id === activeId ? 'active' : ''}`}
              >
                <button
                  type="button"
                  className="conv-title"
                  onClick={() => onSelect(c.id)}
                  title={c.title}
                >
                  {c.title}
                </button>
                <button
                  type="button"
                  className="conv-delete"
                  aria-label={`删除对话：${c.title}`}
                  onClick={() => onDelete(c.id)}
                >
                  <IconTrash />
                </button>
              </div>
            ))
          )}
        </nav>

        <button type="button" className="settings-btn" onClick={onOpenSettings}>
          <IconSettings />
          <span className="settings-text">
            <span>API 设置</span>
            <small>
              <i className={`dot ${apiReady ? 'on' : ''}`} />
              {apiLabel}
            </small>
          </span>
        </button>
      </aside>
    </>
  )
}
