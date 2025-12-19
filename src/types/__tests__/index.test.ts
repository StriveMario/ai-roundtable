import { describe, it, expect } from 'vitest'
import {
  createDefaultExperts,
  createUserMessage,
  createExpertMessage,
  createMessage,
  EXPERT_COLORS,
  DEFAULT_ROUNDTABLE_STATE,
} from '../index'

describe('Expert Types', () => {
  describe('createDefaultExperts', () => {
    it('should create 5 default experts', () => {
      const experts = createDefaultExperts()
      expect(experts).toHaveLength(5)
    })

    it('should have unique IDs for each expert', () => {
      const experts = createDefaultExperts()
      const ids = experts.map((e) => e.id)
      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(5)
    })

    it('should assign different colors to each expert', () => {
      const experts = createDefaultExperts()
      experts.forEach((expert, index) => {
        expect(expert.color).toBe(EXPERT_COLORS[index])
      })
    })

    it('should have required properties for each expert', () => {
      const experts = createDefaultExperts()
      experts.forEach((expert) => {
        expect(expert).toHaveProperty('id')
        expect(expert).toHaveProperty('name')
        expect(expert).toHaveProperty('role')
        expect(expert).toHaveProperty('systemPrompt')
        expect(expert).toHaveProperty('color')
      })
    })

    it('should have expert E as the synthesis expert', () => {
      const experts = createDefaultExperts()
      const expertE = experts.find((e) => e.id === 'expert-e')
      expect(expertE).toBeDefined()
      expect(expertE?.role).toBe('综合专家')
      expect(expertE?.systemPrompt).toContain('【已达成共识】')
    })
  })

  describe('EXPERT_COLORS', () => {
    it('should have 5 colors', () => {
      expect(EXPERT_COLORS).toHaveLength(5)
    })

    it('should be valid hex colors', () => {
      EXPERT_COLORS.forEach((color) => {
        expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/)
      })
    })
  })
})

describe('Message Types', () => {
  describe('createMessage', () => {
    it('should create a message with correct properties', () => {
      const message = createMessage('expert-a', 'Test content', 1)
      expect(message.expertId).toBe('expert-a')
      expect(message.content).toBe('Test content')
      expect(message.round).toBe(1)
      expect(message.isStreaming).toBe(false)
      expect(message.id).toMatch(/^msg-/)
      expect(message.timestamp).toBeGreaterThan(0)
    })

    it('should create unique IDs for each message', () => {
      const msg1 = createMessage('expert-a', 'Content 1', 1)
      const msg2 = createMessage('expert-a', 'Content 2', 1)
      expect(msg1.id).not.toBe(msg2.id)
    })
  })

  describe('createUserMessage', () => {
    it('should create a user message with null expertId', () => {
      const message = createUserMessage('User question', 1)
      expect(message.expertId).toBeNull()
      expect(message.content).toBe('User question')
      expect(message.round).toBe(1)
    })
  })

  describe('createExpertMessage', () => {
    it('should create an expert message with correct expertId', () => {
      const message = createExpertMessage('expert-b', 'Expert response', 2)
      expect(message.expertId).toBe('expert-b')
      expect(message.content).toBe('Expert response')
      expect(message.round).toBe(2)
    })
  })
})

describe('RoundtableState', () => {
  describe('DEFAULT_ROUNDTABLE_STATE', () => {
    it('should have correct default values', () => {
      expect(DEFAULT_ROUNDTABLE_STATE.isDiscussing).toBe(false)
      expect(DEFAULT_ROUNDTABLE_STATE.currentRound).toBe(1)
      expect(DEFAULT_ROUNDTABLE_STATE.currentExpertIndex).toBe(0)
      expect(DEFAULT_ROUNDTABLE_STATE.consensusReached).toBe(false)
      expect(DEFAULT_ROUNDTABLE_STATE.maxRounds).toBe(3)
    })
  })
})
