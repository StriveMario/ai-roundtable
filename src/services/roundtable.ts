import { Expert, Message, ChatMessage, APISite, siteToConfig } from '../types'
import { streamChat, streamChatWithLoadBalancer, StreamCallback, SiteChangeCallback, OpenAIError } from './openai'

// 圆桌会议协调器配置
interface OrchestratorConfig {
  // 使用负载均衡模式
  useLoadBalancer: boolean
  // 获取下一个站点的函数
  getNextSite?: () => APISite | null
  // 标记站点失败
  markSiteFailure?: (siteId: string) => void
  // 标记站点成功
  markSiteSuccess?: (siteId: string) => void
  // 最大重试次数
  maxRetries?: number
  // 站点切换回调
  onSiteChange?: SiteChangeCallback
}

// 圆桌会议协调器类
export class RoundtableOrchestrator {
  private experts: Expert[]
  private config: OrchestratorConfig
  private abortController: AbortController | null = null
  private isRunning = false
  private currentSite: APISite | null = null

  constructor(experts: Expert[], config: OrchestratorConfig) {
    this.experts = experts
    this.config = config
  }

  // 更新专家配置
  updateExperts(experts: Expert[]) {
    this.experts = experts
  }

  // 更新配置
  updateConfig(config: Partial<OrchestratorConfig>) {
    this.config = { ...this.config, ...config }
  }

  // 获取当前使用的站点
  getCurrentSite(): APISite | null {
    return this.currentSite
  }

  // 构建专家的 prompt，包含历史消息
  buildExpertPrompt(
    expert: Expert,
    userQuestion: string,
    previousMessages: Message[],
    currentRound: number
  ): ChatMessage[] {
    const messages: ChatMessage[] = []

    // 系统提示词
    messages.push({
      role: 'system',
      content: expert.systemPrompt,
    })

    // 用户问题
    let userContent = '用户问题：' + userQuestion + '\n\n'

    // 添加之前专家的回答
    if (previousMessages.length > 0) {
      userContent += '以下是其他专家的观点：\n\n'

      for (const msg of previousMessages) {
        if (msg.expertId) {
          const msgExpert = this.experts.find((e) => e.id === msg.expertId)
          if (msgExpert) {
            userContent += '【' + msgExpert.name + '（' + msgExpert.role + '）- 第' + msg.round + '轮】：\n' + msg.content + '\n\n'
          }
        }
      }
    }

    if (currentRound > 1) {
      userContent += '\n这是第 ' + currentRound + ' 轮讨论，请在前面讨论的基础上进一步深化你的观点。'
    }

    userContent += '\n\n请给出你的专业见解：'

    messages.push({
      role: 'user',
      content: userContent,
    })

    return messages
  }

  // 执行单个专家的回答（流式）- 支持负载均衡
  async runExpertTurn(
    expert: Expert,
    userQuestion: string,
    previousMessages: Message[],
    currentRound: number,
    onChunk: StreamCallback
  ): Promise<string> {
    const messages = this.buildExpertPrompt(
      expert,
      userQuestion,
      previousMessages,
      currentRound
    )

    // 使用负载均衡模式
    if (this.config.useLoadBalancer && this.config.getNextSite && this.config.markSiteFailure && this.config.markSiteSuccess) {
      const result = await streamChatWithLoadBalancer(messages, onChunk, {
        getNextSite: this.config.getNextSite,
        markSiteFailure: this.config.markSiteFailure,
        markSiteSuccess: this.config.markSiteSuccess,
        maxRetries: this.config.maxRetries || 3,
        onSiteChange: this.config.onSiteChange,
        signal: this.abortController?.signal,
      })
      this.currentSite = result.usedSite
      return result.content
    }

    // 兼容旧模式：使用单站点
    const site = this.config.getNextSite?.()
    if (!site) {
      throw new OpenAIError('没有可用的API站点', 'no_available_sites')
    }
    this.currentSite = site
    const apiConfig = siteToConfig(site)
    return await streamChat(
      apiConfig,
      messages,
      onChunk,
      this.abortController?.signal
    )
  }

  // 检测是否达成共识
  checkConsensus(lastExpertResponse: string): boolean {
    // 检查最后一个专家（综合专家）的回答中是否包含共识标记
    return lastExpertResponse.includes('【已达成共识】')
  }

  // 启动圆桌会议
  async startRoundtable(
    userQuestion: string,
    maxRounds: number,
    callbacks: {
      onExpertStart: (expertId: string, round: number) => void
      onExpertChunk: (expertId: string, chunk: string) => void
      onExpertEnd: (expertId: string, content: string, round: number) => void
      onRoundEnd: (round: number, consensusReached: boolean) => void
      onComplete: (consensusReached: boolean, totalRounds: number) => void
      onError: (error: Error) => void
      onSiteChange?: (site: APISite, reason: string) => void
    }
  ): Promise<void> {
    if (this.isRunning) {
      throw new Error('圆桌会议已在进行中')
    }

    this.isRunning = true
    this.abortController = new AbortController()
    this.currentSite = null

    // 设置站点切换回调
    if (callbacks.onSiteChange) {
      this.config.onSiteChange = callbacks.onSiteChange
    }

    const allMessages: Message[] = []
    let currentRound = 1
    let consensusReached = false

    try {
      while (currentRound <= maxRounds && !consensusReached) {
        // 依次让每个专家发言
        for (let i = 0; i < this.experts.length; i++) {
          if (!this.isRunning) break

          const expert = this.experts[i]
          callbacks.onExpertStart(expert.id, currentRound)

          // 获取当前专家之前的所有消息（包括本轮之前专家的消息）
          const previousMessages = allMessages.filter(
            (m) => m.round < currentRound || (m.round === currentRound && allMessages.indexOf(m) < allMessages.length)
          )

          let fullContent = ''

          try {
            fullContent = await this.runExpertTurn(
              expert,
              userQuestion,
              previousMessages,
              currentRound,
              (chunk, done) => {
                if (!done) {
                  callbacks.onExpertChunk(expert.id, chunk)
                }
              }
            )
          } catch (error) {
            if ((error as Error).message === 'Request aborted') {
              return
            }
            throw error
          }

          // 创建消息记录
          const message: Message = {
            id: 'msg-' + Date.now() + '-' + expert.id,
            expertId: expert.id,
            content: fullContent,
            timestamp: Date.now(),
            round: currentRound,
          }

          allMessages.push(message)
          callbacks.onExpertEnd(expert.id, fullContent, currentRound)

          // 如果是最后一个专家，检查是否达成共识
          if (i === this.experts.length - 1) {
            consensusReached = this.checkConsensus(fullContent)
          }
        }

        callbacks.onRoundEnd(currentRound, consensusReached)

        if (!consensusReached && currentRound < maxRounds) {
          currentRound++
        } else {
          break
        }
      }

      callbacks.onComplete(consensusReached, currentRound)
    } catch (error) {
      callbacks.onError(error as Error)
    } finally {
      this.isRunning = false
      this.abortController = null
    }
  }

  // 停止圆桌会议
  stopRoundtable() {
    if (this.abortController) {
      this.abortController.abort()
    }
    this.isRunning = false
  }

  // 检查是否正在运行
  getIsRunning() {
    return this.isRunning
  }
}

// 创建圆桌会议协调器实例
let orchestratorInstance: RoundtableOrchestrator | null = null

export function getOrchestrator(
  experts: Expert[],
  config: OrchestratorConfig
): RoundtableOrchestrator {
  if (!orchestratorInstance) {
    orchestratorInstance = new RoundtableOrchestrator(experts, config)
  } else {
    orchestratorInstance.updateExperts(experts)
    orchestratorInstance.updateConfig(config)
  }
  return orchestratorInstance
}

// 重置协调器实例（用于测试或重新初始化）
export function resetOrchestrator() {
  orchestratorInstance = null
}
