# AI Chat Frontend

一个简约风格的 AI 聊天界面，基于 React + Vite + TypeScript。

## 功能

- 流式输出（逐字显示），可随时停止
- 多会话管理，自动保存在浏览器 localStorage
- 复制回复、重新生成最后一条回复
- 轻量 Markdown 渲染：代码块（带复制按钮）、行内代码、粗体、列表、标题
- 自动跟随滚动（向上翻看时不打扰）
- Enter 发送 / Shift+Enter 换行，兼容中文输入法
- 自动适配深色模式和手机屏幕

## 运行

```bash
npm install
npm run dev      # 开发
npm run build    # 打包到 dist/
```

## 接入 API（OpenAI 兼容接口）

1. 打开页面，点击左下角 **API 设置**
2. 选一个预设（OpenAI / DeepSeek / 通义千问 / Ollama 本地），或手动填写 Base URL
3. 填入 API Key 和模型名，保存

之后就会通过 `POST {Base URL}/chat/completions`（`stream: true`）流式获取回复。
没填 API Key 时继续使用模拟回复。

也可以复制 `.env.example` 为 `.env`，设置默认的 Base URL 和模型。

注意事项：

- API Key 只保存在当前浏览器的 localStorage 里，请只在自己的设备上使用，不要部署成公开网站让别人用你的 Key。
- 有些服务商不允许浏览器直接跨域调用（CORS）。遇到「网络请求失败」时，可以换用支持 CORS 的服务，或者通过自己的后端转发。

## 目录结构

```
src/
  api/chat.ts                 聊天接口：OpenAI 兼容流式请求 + 模拟回复
  settings.ts                 API 设置的读取与保存
  hooks/useConversations.ts   会话状态、发送 / 停止 / 重新生成
  components/                 Sidebar、MessageList、Composer、SettingsDialog、Markdown、图标
  App.tsx                     页面布局
  index.css                   全部样式（含深色模式、移动端）
```
