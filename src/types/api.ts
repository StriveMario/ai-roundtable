// API 配置类型
export interface APIConfig {
  baseUrl: string
  apiKey: string
  model: string
  temperature: number
  maxTokens?: number
}

// 默认 API 配置
export const DEFAULT_API_CONFIG: APIConfig = {
  baseUrl: 'https://api.openai.com/v1',
  apiKey: '',
  model: 'gpt-3.5-turbo',
  temperature: 0.7,
  maxTokens: 65535,
}

// 常用模型列表
export const AVAILABLE_MODELS = [
  'gpt-4',
  'gpt-4-turbo',
  'gpt-4o',
  'gpt-4o-mini',
  'gpt-3.5-turbo',
  'claude-3-opus',
  'claude-3-sonnet',
  'claude-3-haiku',
] as const

// API 错误类型
export interface APIError {
  code: string
  message: string
  status?: number
}

// 聊天完成请求
export interface ChatCompletionRequest {
  model: string
  messages: ChatMessage[]
  temperature?: number
  max_tokens?: number
  stream?: boolean
}

// 聊天消息格式
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

// 聊天完成响应
export interface ChatCompletionResponse {
  id: string
  object: string
  created: number
  model: string
  choices: {
    index: number
    message: ChatMessage
    finish_reason: string
  }[]
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

// 流式响应 chunk
export interface ChatCompletionChunk {
  id: string
  object: string
  created: number
  model: string
  choices: {
    index: number
    delta: {
      role?: string
      content?: string
    }
    finish_reason: string | null
  }[]
}

// ============================================
// 多站点负载均衡相关类型
// ============================================

// 单个API站点配置
export interface APISite {
  id: string
  name: string              // 站点名称（用于显示）
  baseUrl: string
  apiKey: string
  model: string
  temperature: number
  maxTokens?: number
  enabled: boolean          // 是否启用
  priority: number          // 优先级（数字越小优先级越高）
}

// 站点健康状态
export interface SiteHealth {
  siteId: string
  failureCount: number      // 连续失败次数
  lastFailure?: number      // 最后失败时间戳
  lastSuccess?: number      // 最后成功时间戳
  status: 'healthy' | 'degraded' | 'unhealthy'
}

// 负载均衡策略类型
export type LoadBalancerStrategy = 'round-robin' | 'priority' | 'random'

// 负载均衡配置
export interface LoadBalancerConfig {
  strategy: LoadBalancerStrategy
  maxFailures: number       // 最大连续失败次数后标记为不健康
  recoveryTime: number      // 恢复检测间隔（毫秒）
  retryCount: number        // 单次请求最大重试次数
}

// 默认负载均衡配置
export const DEFAULT_LOAD_BALANCER_CONFIG: LoadBalancerConfig = {
  strategy: 'round-robin',
  maxFailures: 3,
  recoveryTime: 60000,      // 1分钟后尝试恢复
  retryCount: 3,
}

// 从APISite创建APIConfig的辅助函数
export function siteToConfig(site: APISite): APIConfig {
  return {
    baseUrl: site.baseUrl,
    apiKey: site.apiKey,
    model: site.model,
    temperature: site.temperature,
    maxTokens: site.maxTokens,
  }
}
