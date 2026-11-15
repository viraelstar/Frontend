import { Fragment, useState, type ReactNode } from 'react'

/**
 * 一个很小的 Markdown 渲染器，只支持聊天里最常见的格式：
 * 代码块、行内代码、**粗体**、无序/有序列表、标题、段落。
 * 不使用 dangerouslySetInnerHTML，内容安全。
 */

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const out: ReactNode[] = []
  const re = /(`[^`\n]+`|\*\*[^*\n]+\*\*)/g
  let last = 0
  let m: RegExpExecArray | null
  let i = 0
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index))
    const tok = m[0]
    const key = `${keyPrefix}-${i++}`
    if (tok.startsWith('`')) out.push(<code key={key}>{tok.slice(1, -1)}</code>)
    else out.push(<strong key={key}>{tok.slice(2, -2)}</strong>)
    last = m.index + tok.length
  }
  if (last < text.length) out.push(text.slice(last))
  return out
}

function CodeBlock({ lang, code }: { lang: string; code: string }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* 剪贴板不可用 */
    }
  }
  return (
    <div className="codeblock">
      <div className="codeblock-head">
        <span>{lang || 'code'}</span>
        <button type="button" onClick={copy}>
          {copied ? '已复制' : '复制'}
        </button>
      </div>
      <pre>
        <code>{code}</code>
      </pre>
    </div>
  )
}

export function Markdown({ text }: { text: string }) {
  const lines = text.split('\n')
  const blocks: ReactNode[] = []
  let i = 0
  let k = 0

  while (i < lines.length) {
    const line = lines[i]

    // 代码块（未闭合时也照样显示，适配流式输出）
    const fence = line.match(/^```(\S*)/)
    if (fence) {
      const buf: string[] = []
      i++
      while (i < lines.length && !lines[i].startsWith('```')) buf.push(lines[i++])
      i++
      blocks.push(<CodeBlock key={k++} lang={fence[1]} code={buf.join('\n')} />)
      continue
    }

    // 标题
    const h = line.match(/^(#{1,3})\s+(.*)/)
    if (h) {
      const level = h[1].length
      const Tag = (`h${level + 2}`) as 'h3' | 'h4' | 'h5'
      blocks.push(<Tag key={k}>{renderInline(h[2], `h${k++}`)}</Tag>)
      i++
      continue
    }

    // 列表
    const isUl = /^\s*[-*]\s+/.test(line)
    const isOl = /^\s*\d+\.\s+/.test(line)
    if (isUl || isOl) {
      const re = isUl ? /^\s*[-*]\s+/ : /^\s*\d+\.\s+/
      const items: string[] = []
      while (i < lines.length && re.test(lines[i])) items.push(lines[i++].replace(re, ''))
      const key = k++
      const children = items.map((it, j) => (
        <li key={j}>{renderInline(it, `l${key}-${j}`)}</li>
      ))
      blocks.push(isUl ? <ul key={key}>{children}</ul> : <ol key={key}>{children}</ol>)
      continue
    }

    // 空行
    if (!line.trim()) {
      i++
      continue
    }

    // 段落：合并连续的普通行
    const para: string[] = []
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^```|^#{1,3}\s|^\s*[-*]\s+|^\s*\d+\.\s+/.test(lines[i])
    )
      para.push(lines[i++])
    const key = k++
    blocks.push(
      <p key={key}>
        {para.map((p, j) => (
          <Fragment key={j}>
            {j > 0 && <br />}
            {renderInline(p, `p${key}-${j}`)}
          </Fragment>
        ))}
      </p>,
    )
  }

  return <div className="markdown">{blocks}</div>
}
