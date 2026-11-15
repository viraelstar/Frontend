import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// 从 iOS 主屏幕以 App 方式打开时加上标记，CSS 里修正那里的视口高度问题
const standalone =
  (navigator as Navigator & { standalone?: boolean }).standalone === true ||
  window.matchMedia?.('(display-mode: standalone)').matches
if (standalone) {
  const root = document.documentElement
  root.classList.add('standalone')
  // iOS 在这种模式下算出的视口高度会少一个状态栏，不可靠；
  // 直接用屏幕的实际高度（竖屏取长边，横屏取短边）
  const setHeight = () => {
    const landscape = window.matchMedia('(orientation: landscape)').matches
    const { width, height } = window.screen
    const h = landscape ? Math.min(width, height) : Math.max(width, height)
    root.style.setProperty('--app-h', `${h}px`)
  }
  setHeight()
  window.addEventListener('resize', setHeight)
  window.addEventListener('orientationchange', setHeight)
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
