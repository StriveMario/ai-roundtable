// 消息类型
export interface Message {
  id: string
  expertId: string | null  // null 表示用户消息
  content: string
  timestamp: number
  round: number
  isStreaming?: boolean
}

// 用户消息
export interface UserMessage extends Message {
  expertId: null
}

// 专家消息
export interface ExpertMessage extends Message {
  expertId: string
}

// 创建消息的工具函数
export function createMessage(
  expertId: string | null,
  content: string,
  round: number
): Message {
  return {
    id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    expertId,
    content,
    timestamp: Date.now(),
    round,
    isStreaming: false,
  }
}

// 创建用户消息
export function createUserMessage(content: string, round: number): UserMessage {
  return {
    ...createMessage(null, content, round),
    expertId: null,
  }
}

// 创建专家消息
export function createExpertMessage(
  expertId: string,
  content: string,
  round: number
): ExpertMessage {
  return {
    ...createMessage(expertId, content, round),
    expertId,
  }
}
