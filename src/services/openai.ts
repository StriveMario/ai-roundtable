import { APIConfig, ChatMessage, ChatCompletionChunk, APISite, siteToConfig } from '../types'

// 流式聊天回调类型
export type StreamCallback = (chunk: string, done: boolean) => void

// API 错误类
export class OpenAIError extends Error {
  code: string
  status?: number

  constructor(message: string, code: string, status?: number) {
    super(message)
    this.name = 'OpenAIError'
    this.code = code
    this.status = status
  }
}

// 创建聊天完成请求（流式）
export async function streamChat(
  config: APIConfig,
  messages: ChatMessage[],
  onChunk: StreamCallback,
  signal?: AbortSignal
): Promise<string> {
  const url = `${config.baseUrl}/chat/completions`

  const body = {
    model: config.model,
    messages,
    temperature: config.temperature,
    max_tokens: config.maxTokens,
    stream: true,
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify(body),
      signal,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new OpenAIError(
        errorData.error?.message || `HTTP error ${response.status}`,
        errorData.error?.code || 'http_error',
        response.status
      )
    }

    const reader = response.body?.getReader()
    if (!reader) {
      throw new OpenAIError('No response body', 'no_body')
    }

    const decoder = new TextDecoder()
    let fullContent = ''
    let buffer = ''

    // 处理单行数据的辅助函数
    const processLine = (line: string) => {
      const trimmedLine = line.trim()
      if (!trimmedLine || trimmedLine === 'data: [DONE]') return
      if (!trimmedLine.startsWith('data: ')) return

      try {
        const json = JSON.parse(trimmedLine.slice(6)) as ChatCompletionChunk
        const content = json.choices[0]?.delta?.content || ''
        if (content) {
          fullContent += content
          onChunk(content, false)
        }
      } catch {
        // 忽略解析错误
      }
    }

    while (true) {
      const { done, value } = await reader.read()

      if (done) {
        // 处理 buffer 中剩余的数据
        if (buffer.trim()) {
          processLine(buffer)
        }
        onChunk('', true)
        break
      }

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        processLine(line)
      }
    }

    return fullContent
  } catch (error) {
    if (error instanceof OpenAIError) {
      throw error
    }
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new OpenAIError('Request aborted', 'aborted')
      }
      throw new OpenAIError(error.message, 'network_error')
    }
    throw new OpenAIError('Unknown error', 'unknown')
  }
}

// 非流式聊天
export async function chat(
  config: APIConfig,
  messages: ChatMessage[]
): Promise<string> {
  const url = `${config.baseUrl}/chat/completions`

  const body = {
    model: config.model,
    messages,
    temperature: config.temperature,
    max_tokens: config.maxTokens,
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new OpenAIError(
      errorData.error?.message || `HTTP error ${response.status}`,
      errorData.error?.code || 'http_error',
      response.status
    )
  }

  const data = await response.json()
  return data.choices[0]?.message?.content || ''
}

// 测试 API 连接
export async function testConnection(config: APIConfig): Promise<boolean> {
  const url = `${config.baseUrl}/chat/completions`

  const body = {
    model: config.model,
    messages: [{ role: 'user', content: 'Hi' }],
    temperature: config.temperature,
    max_tokens: 10,
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify(body),
    })

    return response.ok
  } catch {
    return false
  }
}

// 站点切换回调类型
export type SiteChangeCallback = (site: APISite, reason: string) => void

// 负载均衡流式聊天结果
export interface LoadBalancerResult {
  content: string
  usedSite: APISite
  failedSites: Array<{ site: APISite; error: string }>
}

// 带负载均衡的流式聊天
export async function streamChatWithLoadBalancer(
  messages: ChatMessage[],
  onChunk: StreamCallback,
  options: {
    getNextSite: () => APISite | null
    markSiteFailure: (siteId: string) => void
    markSiteSuccess: (siteId: string) => void
    maxRetries: number
    onSiteChange?: SiteChangeCallback
    signal?: AbortSignal
  }
): Promise<LoadBalancerResult> {
  const { getNextSite, markSiteFailure, markSiteSuccess, maxRetries, onSiteChange, signal } = options
  
  const failedSites: Array<{ site: APISite; error: string }> = []
  let attempts = 0
  let lastError: Error | null = null

  while (attempts < maxRetries) {
    // 检查是否已取消
    if (signal && signal.aborted) {
      throw new OpenAIError('Request aborted', 'aborted')
    }

    // 获取下一个可用站点
    const site = getNextSite()
    if (!site) {
      throw new OpenAIError(
        '没有可用的API站点',
        'no_available_sites'
      )
    }

    attempts++
    const config = siteToConfig(site)

    try {
      // 通知站点切换（如果不是第一次尝试）
      if (attempts > 1 && onSiteChange) {
        const reason = lastError ? lastError.message : '上一个站点请求失败'
        onSiteChange(site, reason)
      }

      // 尝试请求
      const content = await streamChat(config, messages, onChunk, signal)
      
      // 成功，标记站点健康
      markSiteSuccess(site.id)
      
      return {
        content,
        usedSite: site,
        failedSites,
      }
    } catch (error) {
      // 记录失败
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      failedSites.push({ site, error: errorMessage })
      lastError = error instanceof Error ? error : new Error(errorMessage)

      // 如果是用户取消，直接抛出
      if (error instanceof OpenAIError && error.code === 'aborted') {
        throw error
      }

      // 标记站点失败
      markSiteFailure(site.id)

      // 如果还有重试机会，继续尝试
      if (attempts < maxRetries) {
        continue
      }
    }
  }

  // 所有重试都失败了
  const errorMsg = lastError ? lastError.message : 'Unknown error'
  throw new OpenAIError(
    '所有站点请求失败 (尝试了 ' + attempts + ' 次): ' + errorMsg,
    'all_sites_failed'
  )
}

// 测试单个站点连接
export async function testSiteConnection(site: APISite): Promise<boolean> {
  const config = siteToConfig(site)
  return testConnection(config)
}

// 批量测试站点连接
export async function testAllSitesConnection(
  sites: APISite[]
): Promise<Map<string, boolean>> {
  const results = new Map<string, boolean>()
  
  const promises = sites.map(async (site) => {
    const success = await testSiteConnection(site)
    results.set(site.id, success)
  })
  
  await Promise.allSettled(promises)
  return results
}
