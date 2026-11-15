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

## 接入真实 API

目前回复是本地模拟的。接入时只需修改 `src/api/chat.ts` 里的 `streamChat`：
每收到一段文字调用 `onDelta(text)`，并在 `signal` 中止时停止请求，界面其它部分不需要改。

> 注意：不要把 API Key 直接写进前端代码，建议通过自己的后端转发请求。

## 目录结构

```
src/
  api/chat.ts                 聊天接口（目前为模拟实现）
  hooks/useConversations.ts   会话状态、发送 / 停止 / 重新生成
  components/                 Sidebar、MessageList、Composer、Markdown、图标
  App.tsx                     页面布局
  index.css                   全部样式（含深色模式、移动端）
```
