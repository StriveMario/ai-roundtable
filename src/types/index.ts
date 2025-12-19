// 导出所有类型
export * from './expert'
export * from './message'
export * from './api'

import { Expert } from './expert'
import { Message } from './message'

// 专家配置组（预设）
export interface ExpertPreset {
  id: string
  name: string
  description?: string
  experts: Expert[]
  createdAt: number
  updatedAt: number
}

// 聊天记录
export interface ChatHistory {
  id: string
  title: string
  messages: Message[]
  expertPresetId?: string  // 关联的专家配置组ID
  createdAt: number
  updatedAt: number
}

// 创建专家配置组
export function createExpertPreset(name: string, experts: Expert[], description?: string): ExpertPreset {
  return {
    id: `preset-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name,
    description,
    experts: JSON.parse(JSON.stringify(experts)), // 深拷贝
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
}

// 创建聊天记录
export function createChatHistory(title: string, messages: Message[], expertPresetId?: string): ChatHistory {
  return {
    id: `chat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    title,
    messages: JSON.parse(JSON.stringify(messages)), // 深拷贝
    expertPresetId,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
}

// 圆桌会议状态
export interface RoundtableState {
  isDiscussing: boolean
  currentRound: number
  currentExpertIndex: number
  consensusReached: boolean
  maxRounds: number
}

// 默认圆桌会议状态
export const DEFAULT_ROUNDTABLE_STATE: RoundtableState = {
  isDiscussing: false,
  currentRound: 1,
  currentExpertIndex: 0,
  consensusReached: false,
  maxRounds: 3,
}
