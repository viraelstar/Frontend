import { useState } from 'react'
import { useConversations } from './hooks/useConversations'
import { Sidebar } from './components/Sidebar'
import { MessageList } from './components/MessageList'
import { Composer } from './components/Composer'
import { SettingsDialog } from './components/SettingsDialog'
import { IconMenu, IconPlus } from './components/icons'
import { isConfigured, loadSettings, saveSettings, type ApiSettings } from './settings'

const SUGGESTIONS = [
  '帮我写一封请假邮件',
  '用简单的话解释什么是 API',
  '推荐几本适合入门的编程书',
  '给我的周末做个计划',
]

export default function App() {
  const chat = useConversations()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const closeSidebar = () => setSidebarOpen(false)
  const [settings, setSettings] = useState<ApiSettings>(loadSettings)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const apiReady = isConfigured(settings)

  const handleSaveSettings = (s: ApiSettings) => {
    saveSettings(s)
    setSettings(s)
    setSettingsOpen(false)
  }

  const messages = chat.active?.messages ?? []
  const isEmpty = messages.length === 0

  return (
    <div className="app">
      <Sidebar
        conversations={chat.conversations}
        activeId={chat.active?.id ?? null}
        open={sidebarOpen}
        onNew={() => {
          chat.newChat()
          closeSidebar()
        }}
        onSelect={(id) => {
          chat.select(id)
          closeSidebar()
        }}
        onDelete={chat.remove}
        onClose={closeSidebar}
        apiReady={apiReady}
        apiLabel={apiReady ? settings.model : '未配置 · 模拟回复'}
        onOpenSettings={() => {
          setSettingsOpen(true)
          closeSidebar()
        }}
      />

      <SettingsDialog
        open={settingsOpen}
        settings={settings}
        onSave={handleSaveSettings}
        onClose={() => setSettingsOpen(false)}
      />

      <main className="main">
        <header className="topbar">
          <button
            type="button"
            className="icon-btn mobile-only"
            aria-label="打开侧边栏"
            onClick={() => setSidebarOpen(true)}
          >
            <IconMenu />
          </button>
          <h1 className="topbar-title">{chat.active?.title ?? '新对话'}</h1>
          <button
            type="button"
            className="icon-btn mobile-only"
            aria-label="新对话"
            onClick={chat.newChat}
          >
            <IconPlus />
          </button>
        </header>

        {isEmpty ? (
          <section className="welcome">
            <h2>有什么可以帮你的？</h2>
            <div className="suggestions">
              {SUGGESTIONS.map((s) => (
                <button key={s} type="button" onClick={() => chat.send(s)}>
                  {s}
                </button>
              ))}
            </div>
          </section>
        ) : (
          <MessageList
            messages={messages}
            streamingId={chat.streamingId}
            onRegenerate={chat.regenerate}
          />
        )}

        <Composer
          streaming={chat.streamingId !== null}
          onSend={chat.send}
          onStop={chat.stop}
          autoFocusKey={chat.active?.id ?? null}
        />
      </main>
    </div>
  )
}
