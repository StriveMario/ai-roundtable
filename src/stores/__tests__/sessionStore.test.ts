import { describe, it, expect, beforeEach } from 'vitest'
import { useSessionStore } from '../sessionStore'
import { DEFAULT_ROUNDTABLE_STATE } from '../../types'

describe('sessionStore', () => {
  beforeEach(() => {
    // Reset store to default state before each test
    useSessionStore.setState({
      messages: [],
      roundtableState: { ...DEFAULT_ROUNDTABLE_STATE }
    })
  })

  describe('initial state', () => {
    it('should have empty messages', () => {
      const { messages } = useSessionStore.getState()
      expect(messages).toHaveLength(0)
    })

    it('should have default roundtable state', () => {
      const { roundtableState } = useSessionStore.getState()
      expect(roundtableState.isDiscussing).toBe(false)
      expect(roundtableState.currentRound).toBe(1)
      expect(roundtableState.currentExpertIndex).toBe(0)
    })
  })

  describe('addMessage', () => {
    it('should add a message to the list', () => {
      const message = {
        id: 'test-1',
        expertId: 'expert-a',
        content: 'Test message',
        timestamp: Date.now(),
        round: 1
      }
      useSessionStore.getState().addMessage(message)

      const { messages } = useSessionStore.getState()
      expect(messages).toHaveLength(1)
      expect(messages[0].id).toBe('test-1')
    })
  })

  describe('addUserMessage', () => {
    it('should add a user message with null expertId', () => {
      useSessionStore.getState().addUserMessage('User question')

      const { messages } = useSessionStore.getState()
      expect(messages).toHaveLength(1)
      expect(messages[0].expertId).toBeNull()
      expect(messages[0].content).toBe('User question')
    })

    it('should use current round from roundtable state', () => {
      useSessionStore.setState({
        ...useSessionStore.getState(),
        roundtableState: { ...DEFAULT_ROUNDTABLE_STATE, currentRound: 2 }
      })
      useSessionStore.getState().addUserMessage('Question in round 2')

      const { messages } = useSessionStore.getState()
      expect(messages[0].round).toBe(2)
    })
  })

  describe('addExpertMessage', () => {
    it('should add an expert message with correct expertId', () => {
      useSessionStore.getState().addExpertMessage('expert-b', 'Expert response')

      const { messages } = useSessionStore.getState()
      expect(messages).toHaveLength(1)
      expect(messages[0].expertId).toBe('expert-b')
      expect(messages[0].content).toBe('Expert response')
    })
  })

  describe('updateMessage', () => {
    it('should update a specific message', () => {
      const message = {
        id: 'test-1',
        expertId: 'expert-a',
        content: 'Original',
        timestamp: Date.now(),
        round: 1
      }
      useSessionStore.getState().addMessage(message)
      useSessionStore.getState().updateMessage('test-1', { content: 'Updated' })

      const { messages } = useSessionStore.getState()
      expect(messages[0].content).toBe('Updated')
    })
  })

  describe('clearMessages', () => {
    it('should remove all messages', () => {
      useSessionStore.getState().addUserMessage('Message 1')
      useSessionStore.getState().addUserMessage('Message 2')
      expect(useSessionStore.getState().messages).toHaveLength(2)

      useSessionStore.getState().clearMessages()
      expect(useSessionStore.getState().messages).toHaveLength(0)
    })
  })

  describe('startDiscussion', () => {
    it('should set isDiscussing to true', () => {
      useSessionStore.getState().startDiscussion()

      const { roundtableState } = useSessionStore.getState()
      expect(roundtableState.isDiscussing).toBe(true)
    })

    it('should reset round and expert index', () => {
      useSessionStore.setState({
        ...useSessionStore.getState(),
        roundtableState: { ...DEFAULT_ROUNDTABLE_STATE, currentRound: 3, currentExpertIndex: 4 }
      })
      useSessionStore.getState().startDiscussion()

      const { roundtableState } = useSessionStore.getState()
      expect(roundtableState.currentRound).toBe(1)
      expect(roundtableState.currentExpertIndex).toBe(0)
    })

    it('should reset consensusReached', () => {
      useSessionStore.setState({
        ...useSessionStore.getState(),
        roundtableState: { ...DEFAULT_ROUNDTABLE_STATE, consensusReached: true }
      })
      useSessionStore.getState().startDiscussion()

      const { roundtableState } = useSessionStore.getState()
      expect(roundtableState.consensusReached).toBe(false)
    })
  })

  describe('stopDiscussion', () => {
    it('should set isDiscussing to false', () => {
      useSessionStore.getState().startDiscussion()
      useSessionStore.getState().stopDiscussion()

      const { roundtableState } = useSessionStore.getState()
      expect(roundtableState.isDiscussing).toBe(false)
    })
  })

  describe('nextExpert', () => {
    it('should increment currentExpertIndex', () => {
      useSessionStore.getState().nextExpert()

      const { roundtableState } = useSessionStore.getState()
      expect(roundtableState.currentExpertIndex).toBe(1)
    })
  })

  describe('nextRound', () => {
    it('should increment currentRound', () => {
      useSessionStore.getState().nextRound()

      const { roundtableState } = useSessionStore.getState()
      expect(roundtableState.currentRound).toBe(2)
    })

    it('should reset currentExpertIndex to 0', () => {
      useSessionStore.setState({
        ...useSessionStore.getState(),
        roundtableState: { ...DEFAULT_ROUNDTABLE_STATE, currentExpertIndex: 4 }
      })
      useSessionStore.getState().nextRound()

      const { roundtableState } = useSessionStore.getState()
      expect(roundtableState.currentExpertIndex).toBe(0)
    })
  })

  describe('setConsensusReached', () => {
    it('should set consensusReached to true', () => {
      useSessionStore.getState().setConsensusReached(true)

      const { roundtableState } = useSessionStore.getState()
      expect(roundtableState.consensusReached).toBe(true)
    })

    it('should stop discussion when consensus is reached', () => {
      useSessionStore.getState().startDiscussion()
      useSessionStore.getState().setConsensusReached(true)

      const { roundtableState } = useSessionStore.getState()
      expect(roundtableState.isDiscussing).toBe(false)
    })
  })

  describe('resetRoundtable', () => {
    it('should reset all state', () => {
      useSessionStore.getState().addUserMessage('Test')
      useSessionStore.getState().startDiscussion()
      useSessionStore.getState().nextRound()

      useSessionStore.getState().resetRoundtable()

      const { messages, roundtableState } = useSessionStore.getState()
      expect(messages).toHaveLength(0)
      expect(roundtableState).toEqual(DEFAULT_ROUNDTABLE_STATE)
    })
  })

  describe('setCurrentExpertIndex', () => {
    it('should set currentExpertIndex to specific value', () => {
      useSessionStore.getState().setCurrentExpertIndex(3)

      const { roundtableState } = useSessionStore.getState()
      expect(roundtableState.currentExpertIndex).toBe(3)
    })
  })
})
