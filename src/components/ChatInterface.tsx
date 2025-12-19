import { useEffect, useRef, useState } from 'react'
import { useSessionStore, useExpertStore, useAPIStore } from '../stores'
import { ExpertMessage } from './ExpertMessage'
import { UserInput } from './UserInput'
import { getOrchestrator } from '../services'
import { MessageCircle, Users, Wifi } from 'lucide-react'
import { APISite } from '../types'

export function ChatInterface() {
  const { messages, roundtableState, addUserMessage, addMessage, updateMessage, startDiscussion, stopDiscussion, setConsensusReached, nextRound, resetRoundtable } = useSessionStore()
  const { experts } = useExpertStore()
  const { sites, isConfigured, getNextSite, markSiteFailure, markSiteSuccess, loadBalancerConfig } = useAPIStore()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null)
  const [currentSite, setCurrentSite] = useState<APISite | null>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSubmit = async (content: string) => {
    if (!isConfigured) {
      alert('请先配置 API 设置')
      return
    }

    // 重置状态
    resetRoundtable()
    setCurrentSite(null)

    // 添加用户消息
    addUserMessage(content)
    startDiscussion()

    const orchestrator = getOrchestrator(experts, {
      useLoadBalancer: sites.length > 0,
      getNextSite,
      markSiteFailure,
      markSiteSuccess,
      maxRetries: loadBalancerConfig.retryCount,
    })

    await orchestrator.startRoundtable(content, roundtableState.maxRounds, {
      onExpertStart: (expertId, round) => {
        const newMessage = {
          id: 'msg-' + Date.now() + '-' + expertId,
          expertId,
          content: '',
          timestamp: Date.now(),
          round,
          isStreaming: true,
        }
        addMessage(newMessage)
        setStreamingMessageId(newMessage.id)
      },
      onExpertChunk: (_expertId, chunk) => {
        if (streamingMessageId) {
          const currentMsg = messages.find(m => m.id === streamingMessageId)
          if (currentMsg) {
            updateMessage(streamingMessageId, {
              content: currentMsg.content + chunk,
            })
          }
        }
        // 使用 store 的最新状态更新
        useSessionStore.setState((state) => ({
          messages: state.messages.map((m) =>
            m.isStreaming ? { ...m, content: m.content + chunk } : m
          ),
        }))
      },
      onExpertEnd: (expertId, content, round) => {
        useSessionStore.setState((state) => ({
          messages: state.messages.map((m) =>
            m.expertId === expertId && m.round === round && m.isStreaming
              ? { ...m, content, isStreaming: false }
              : m
          ),
        }))
        setStreamingMessageId(null)
      },
      onRoundEnd: (round, consensusReached) => {
        if (consensusReached) {
          setConsensusReached(true)
        } else if (round < roundtableState.maxRounds) {
          nextRound()
        }
      },
      onComplete: (consensusReached) => {
        stopDiscussion()
        if (consensusReached) {
          setConsensusReached(true)
        }
      },
      onError: (error) => {
        console.error('头脑风暴错误:', error)
        stopDiscussion()
        alert('发生错误: ' + error.message)
      },
      onSiteChange: (site, reason) => {
        setCurrentSite(site)
        console.log('站点切换到:', site.name, '原因:', reason)
      },
    })
  }

  const handleStop = () => {
    const orchestrator = getOrchestrator(experts, {
      useLoadBalancer: sites.length > 0,
      getNextSite,
      markSiteFailure,
      markSiteSuccess,
      maxRetries: loadBalancerConfig.retryCount,
    })
    orchestrator.stopRoundtable()
    stopDiscussion()
  }

  const userMessages = messages.filter((m) => m.expertId === null)
  const expertMessages = messages.filter((m) => m.expertId !== null)

  return (
    <div className="flex flex-col h-full">
      {/* 状态栏 */}
      {roundtableState.isDiscussing && (
        <div className="bg-blue-50 border-b border-blue-200 px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2 text-blue-700">
            <Users className="w-4 h-4 animate-pulse" />
            <span>
              第 {roundtableState.currentRound} 轮讨论进行中...
            </span>
          </div>
          {currentSite && (
            <div className="flex items-center gap-1 text-xs text-blue-600">
              <Wifi className="w-3 h-3" />
              <span>{currentSite.name}</span>
            </div>
          )}
        </div>
      )}

      {roundtableState.consensusReached && (
        <div className="bg-green-50 border-b border-green-200 px-4 py-2 flex items-center gap-2 text-green-700">
          <MessageCircle className="w-4 h-4" />
          <span>各角色已达成共识！</span>
        </div>
      )}

      {/* 讨论主题 - 顶部常驻 */}
      {userMessages.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200 px-4 py-3 flex-shrink-0">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold flex-shrink-0 text-sm">
              你
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-blue-600 font-medium mb-1">讨论主题</div>
              <div className="text-gray-800 text-sm line-clamp-3 whitespace-pre-wrap">
                {userMessages[userMessages.length - 1]?.content}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400">
            <MessageCircle className="w-16 h-16 mb-4" />
            <p className="text-lg">开始一场头脑风暴</p>
            <p className="text-sm mt-2">输入问题，让多个AI角色为你分析讨论</p>
          </div>
        ) : (
          <div className="divide-y">
            {/* 角色回答 */}
            {expertMessages.map((message) => (
              <ExpertMessage
                key={message.id}
                message={message}
                expert={experts.find((e) => e.id === message.expertId)}
                isStreaming={message.isStreaming}
              />
            ))}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 输入区域 */}
      <UserInput
        onSubmit={handleSubmit}
        onStop={handleStop}
        isDiscussing={roundtableState.isDiscussing}
        disabled={!isConfigured}
      />
    </div>
  )
}
