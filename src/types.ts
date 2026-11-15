export type Role = 'user' | 'assistant'

export interface Message {
  id: string
  role: Role
  content: string
  createdAt: number
  /** 推理模型的思考过程 */
  reasoning?: string
  /** 思考用时（毫秒），思考结束后才有值 */
  reasoningMs?: number
  /** 助手回复出错时为 true */
  error?: boolean
}

export interface Conversation {
  id: string
  title: string
  messages: Message[]
  updatedAt: number
}
