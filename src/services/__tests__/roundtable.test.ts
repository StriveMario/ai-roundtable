import { describe, it, expect, vi, beforeEach } from 'vitest'
import { RoundtableOrchestrator, getOrchestrator, resetOrchestrator } from '../roundtable'
import { Expert, APISite } from '../../types'
import * as openaiModule from '../openai'

// Mock the openai module
vi.mock('../openai', () => ({
  streamChat: vi.fn(),
  streamChatWithLoadBalancer: vi.fn()
}))

const mockExperts: Expert[] = [
  { id: 'expert-a', name: 'Expert A', role: 'Tech', systemPrompt: 'You are a tech expert', color: '#000' },
  { id: 'expert-b', name: 'Expert B', role: 'Product', systemPrompt: 'You are a product expert', color: '#111' },
  { id: 'expert-e', name: 'Expert E', role: 'Synthesis', systemPrompt: 'You synthesize all views', color: '#222' }
]

const mockSite: APISite = {
  id: 'site-1',
  name: 'Test Site',
  baseUrl: 'https://api.openai.com/v1',
  apiKey: 'test-key',
  model: 'gpt-3.5-turbo',
  temperature: 0.7,
  enabled: true,
  priority: 1
}

const mockConfig = {
  useLoadBalancer: true,
  getNextSite: () => mockSite,
  markSiteFailure: vi.fn(),
  markSiteSuccess: vi.fn(),
  maxRetries: 3
}

describe('RoundtableOrchestrator', () => {
  let orchestrator: RoundtableOrchestrator

  beforeEach(() => {
    vi.clearAllMocks()
    resetOrchestrator()
    orchestrator = new RoundtableOrchestrator(mockExperts, mockConfig)
  })

  describe('constructor', () => {
    it('should initialize with experts and config', () => {
      expect(orchestrator).toBeDefined()
      expect(orchestrator.getIsRunning()).toBe(false)
    })
  })

  describe('updateExperts', () => {
    it('should update the experts list', () => {
      const newExperts = [{ id: 'new', name: 'New', role: 'New', systemPrompt: 'New', color: '#333' }]
      orchestrator.updateExperts(newExperts)
      expect(orchestrator).toBeDefined()
    })
  })

  describe('updateConfig', () => {
    it('should update the config', () => {
      const newConfig = { ...mockConfig, maxRetries: 5 }
      orchestrator.updateConfig(newConfig)
      expect(orchestrator).toBeDefined()
    })
  })

  describe('buildExpertPrompt', () => {
    it('should build prompt with user question and return ChatMessage array', () => {
      const expert = mockExperts[0]
      const userQuestion = 'What is the best approach?'
      const round = 1

      const messages = orchestrator.buildExpertPrompt(expert, userQuestion, [], round)

      expect(Array.isArray(messages)).toBe(true)
      expect(messages.length).toBeGreaterThan(0)
      expect(messages[0].role).toBe('system')
      expect(messages[0].content).toContain(expert.systemPrompt)
    })

    it('should include round info in user message', () => {
      const expert = mockExperts[0]
      const userQuestion = 'What is the best approach?'
      const round = 2

      const messages = orchestrator.buildExpertPrompt(expert, userQuestion, [], round)

      const userMessage = messages.find(m => m.role === 'user')
      expect(userMessage?.content).toContain('第 2 轮')
    })
  })

  describe('checkConsensus', () => {
    it('should return false when response does not contain consensus marker', () => {
      const result = orchestrator.checkConsensus('This is a normal response')
      expect(result).toBe(false)
    })

    it('should return true when response contains consensus marker', () => {
      const result = orchestrator.checkConsensus('经过讨论，【已达成共识】我们认为...')
      expect(result).toBe(true)
    })
  })

  describe('startRoundtable', () => {
    it('should start discussion and call API for each expert', async () => {
      const mockStreamChatWithLoadBalancer = vi.mocked(openaiModule.streamChatWithLoadBalancer)
      mockStreamChatWithLoadBalancer.mockResolvedValue({
        content: 'Expert response',
        usedSite: mockSite,
        failedSites: []
      })

      const userQuestion = 'What should we do?'
      const callbacks = {
        onExpertStart: vi.fn(),
        onExpertChunk: vi.fn(),
        onExpertEnd: vi.fn(),
        onRoundEnd: vi.fn(),
        onComplete: vi.fn(),
        onError: vi.fn()
      }

      await orchestrator.startRoundtable(userQuestion, 1, callbacks)

      expect(mockStreamChatWithLoadBalancer).toHaveBeenCalled()
      expect(callbacks.onExpertStart).toHaveBeenCalled()
      expect(callbacks.onComplete).toHaveBeenCalled()
    })
  })

  describe('stopRoundtable', () => {
    it('should stop the discussion', () => {
      orchestrator.stopRoundtable()
      expect(orchestrator.getIsRunning()).toBe(false)
    })
  })
})

describe('getOrchestrator', () => {
  beforeEach(() => {
    resetOrchestrator()
  })

  it('should return singleton instance', () => {
    const instance1 = getOrchestrator(mockExperts, mockConfig)
    const instance2 = getOrchestrator(mockExperts, mockConfig)
    expect(instance1).toBe(instance2)
  })

  it('should update experts when called with new experts', () => {
    const instance1 = getOrchestrator(mockExperts, mockConfig)
    const newExperts = [{ id: 'new', name: 'New', role: 'New', systemPrompt: 'New', color: '#333' }]
    const instance2 = getOrchestrator(newExperts, mockConfig)
    expect(instance1).toBe(instance2)
  })
})
