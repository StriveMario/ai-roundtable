import { describe, it, expect, beforeEach } from 'vitest'
import { useExpertStore } from '../expertStore'
import { createDefaultExperts } from '../../types'

describe('expertStore', () => {
  beforeEach(() => {
    // Reset store to default state before each test
    useExpertStore.setState({ experts: createDefaultExperts() })
  })

  describe('initial state', () => {
    it('should have 5 default experts', () => {
      const { experts } = useExpertStore.getState()
      expect(experts).toHaveLength(5)
    })
  })

  describe('setExperts', () => {
    it('should replace all experts', () => {
      const newExperts = [
        { id: 'new-1', name: 'New Expert', role: 'Test', systemPrompt: 'Test prompt', color: '#000000' }
      ]
      useExpertStore.getState().setExperts(newExperts)

      const { experts } = useExpertStore.getState()
      expect(experts).toHaveLength(1)
      expect(experts[0].id).toBe('new-1')
    })
  })

  describe('updateExpert', () => {
    it('should update a specific expert', () => {
      useExpertStore.getState().updateExpert('expert-a', { name: 'Updated Name' })

      const { experts } = useExpertStore.getState()
      const expertA = experts.find(e => e.id === 'expert-a')
      expect(expertA?.name).toBe('Updated Name')
    })

    it('should not affect other experts', () => {
      const originalExpertB = useExpertStore.getState().experts.find(e => e.id === 'expert-b')
      useExpertStore.getState().updateExpert('expert-a', { name: 'Updated Name' })

      const { experts } = useExpertStore.getState()
      const expertB = experts.find(e => e.id === 'expert-b')
      expect(expertB?.name).toBe(originalExpertB?.name)
    })

    it('should handle non-existent expert ID gracefully', () => {
      const originalExperts = [...useExpertStore.getState().experts]
      useExpertStore.getState().updateExpert('non-existent', { name: 'Test' })

      const { experts } = useExpertStore.getState()
      expect(experts).toEqual(originalExperts)
    })
  })

  describe('resetExperts', () => {
    it('should reset to default experts', () => {
      // First modify the experts
      useExpertStore.getState().setExperts([])
      expect(useExpertStore.getState().experts).toHaveLength(0)

      // Then reset
      useExpertStore.getState().resetExperts()
      expect(useExpertStore.getState().experts).toHaveLength(5)
    })
  })

  describe('getExpertById', () => {
    it('should return the correct expert', () => {
      const expert = useExpertStore.getState().getExpertById('expert-c')
      expect(expert?.id).toBe('expert-c')
      expect(expert?.role).toBe('战略专家')
    })

    it('should return undefined for non-existent ID', () => {
      const expert = useExpertStore.getState().getExpertById('non-existent')
      expect(expert).toBeUndefined()
    })
  })
})
