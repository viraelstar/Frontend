import { useEffect, useRef, useState } from 'react'
import { DEFAULT_SETTINGS, type ApiSettings } from '../settings'

interface Props {
  open: boolean
  settings: ApiSettings
  onSave: (s: ApiSettings) => void
  onClose: () => void
}

const PRESETS = [
  { name: 'OpenAI', baseUrl: 'https://api.openai.com/v1', model: 'gpt-4o-mini' },
  { name: 'DeepSeek', baseUrl: 'https://api.deepseek.com/v1', model: 'deepseek-chat' },
  {
    name: '通义千问',
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    model: 'qwen-plus',
  },
  { name: 'Ollama 本地', baseUrl: 'http://localhost:11434/v1', model: 'llama3.1' },
]

export function SettingsDialog({ open, settings, onSave, onClose }: Props) {
  const ref = useRef<HTMLDialogElement>(null)
  const [form, setForm] = useState(settings)
  const [showKey, setShowKey] = useState(false)

  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) {
      setForm(settings)
      setShowKey(false)
      d.showModal()
    } else if (!open && d.open) d.close()
  }, [open, settings])

  const set = (k: keyof ApiSettings) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => setForm((f) => ({ ...f, [k]: e.target.value }))

  return (
    <dialog
      ref={ref}
      className="dialog"
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
    >
      <form
        method="dialog"
        className="dialog-body"
        onSubmit={(e) => {
          e.preventDefault()
          onSave(form)
        }}
      >
        <h2>API 设置</h2>
        <p className="dialog-desc">
          支持任何 OpenAI 兼容接口。设置只保存在这个浏览器里。不填 API Key 时使用模拟回复。
        </p>

        <div className="presets">
          {PRESETS.map((p) => (
            <button
              key={p.name}
              type="button"
              className={form.baseUrl === p.baseUrl ? 'active' : ''}
              onClick={() => setForm((f) => ({ ...f, baseUrl: p.baseUrl, model: p.model }))}
            >
              {p.name}
            </button>
          ))}
        </div>

        <label className="field">
          <span>Base URL</span>
          <input
            value={form.baseUrl}
            onChange={set('baseUrl')}
            placeholder={DEFAULT_SETTINGS.baseUrl}
            spellCheck={false}
            autoComplete="off"
          />
        </label>

        <label className="field">
          <span>API Key</span>
          <div className="field-row">
            <input
              type={showKey ? 'text' : 'password'}
              value={form.apiKey}
              onChange={set('apiKey')}
              placeholder="sk-..."
              spellCheck={false}
              autoComplete="off"
            />
            <button type="button" className="ghost-btn" onClick={() => setShowKey((v) => !v)}>
              {showKey ? '隐藏' : '显示'}
            </button>
          </div>
        </label>

        <label className="field">
          <span>模型</span>
          <input
            value={form.model}
            onChange={set('model')}
            placeholder="gpt-4o-mini"
            spellCheck={false}
            autoComplete="off"
          />
        </label>

        <label className="field">
          <span>系统提示词（可选）</span>
          <textarea
            rows={3}
            value={form.systemPrompt}
            onChange={set('systemPrompt')}
            placeholder="例如：你是一个耐心友好的助手，用中文回答。"
          />
        </label>

        <p className="dialog-note">
          ⚠ API Key 保存在浏览器本地，请只在自己的设备上使用。部分服务商不允许浏览器直接跨域调用，
          遇到网络错误时可以换用支持 CORS 的服务，或通过自己的后端转发。
        </p>

        <div className="dialog-actions">
          <button type="button" className="ghost-btn" onClick={onClose}>
            取消
          </button>
          <button type="submit" className="primary-btn">
            保存
          </button>
        </div>
      </form>
    </dialog>
  )
}
