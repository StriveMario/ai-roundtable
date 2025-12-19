import { describe, it, expect, beforeEach } from 'vitest'
import { useAPIStore } from '../apiStore'
import { DEFAULT_API_CONFIG } from '../../types'

describe('apiStore', () => {
  beforeEach(() => {
    // Reset store to default state before each test
    useAPIStore.setState({
      config: { ...DEFAULT_API_CONFIG },
      isConfigured: false
    })
  })

  describe('initial state', () => {
    it('should have default config', () => {
      const { config } = useAPIStore.getState()
      expect(config.baseUrl).toBe('https://api.openai.com/v1')
      expect(config.apiKey).toBe('')
      expect(config.model).toBe('gpt-3.5-turbo')
      expect(config.temperature).toBe(0.7)
    })

    it('should not be configured initially', () => {
      const { isConfigured } = useAPIStore.getState()
      expect(isConfigured).toBe(false)
    })
  })

  describe('setConfig', () => {
    it('should update config with partial updates', () => {
      useAPIStore.getState().setConfig({ apiKey: 'test-key' })

      const { config } = useAPIStore.getState()
      expect(config.apiKey).toBe('test-key')
      expect(config.baseUrl).toBe('https://api.openai.com/v1') // unchanged
    })

    it('should set isConfigured to true when apiKey and baseUrl are set', () => {
      useAPIStore.getState().setConfig({
        apiKey: 'test-key',
        baseUrl: 'https://api.example.com'
      })

      const { isConfigured } = useAPIStore.getState()
      expect(isConfigured).toBe(true)
    })

    it('should set isConfigured to false when apiKey is empty', () => {
      useAPIStore.getState().setConfig({
        apiKey: 'test-key',
        baseUrl: 'https://api.example.com'
      })
      useAPIStore.getState().setConfig({ apiKey: '' })

      const { isConfigured } = useAPIStore.getState()
      expect(isConfigured).toBe(false)
    })
  })

  describe('resetConfig', () => {
    it('should reset to default config', () => {
      useAPIStore.getState().setConfig({
        apiKey: 'test-key',
        baseUrl: 'https://custom.api.com',
        model: 'gpt-4'
      })

      useAPIStore.getState().resetConfig()

      const { config, isConfigured } = useAPIStore.getState()
      expect(config).toEqual(DEFAULT_API_CONFIG)
      expect(isConfigured).toBe(false)
    })
  })

  describe('setApiKey', () => {
    it('should update only the apiKey', () => {
      useAPIStore.getState().setApiKey('new-api-key')

      const { config } = useAPIStore.getState()
      expect(config.apiKey).toBe('new-api-key')
    })
  })

  describe('setBaseUrl', () => {
    it('should update only the baseUrl', () => {
      useAPIStore.getState().setBaseUrl('https://new.api.com')

      const { config } = useAPIStore.getState()
      expect(config.baseUrl).toBe('https://new.api.com')
    })
  })

  describe('setModel', () => {
    it('should update only the model', () => {
      useAPIStore.getState().setModel('gpt-4')

      const { config } = useAPIStore.getState()
      expect(config.model).toBe('gpt-4')
    })
  })

  describe('setTemperature', () => {
    it('should update only the temperature', () => {
      useAPIStore.getState().setTemperature(0.5)

      const { config } = useAPIStore.getState()
      expect(config.temperature).toBe(0.5)
    })
  })
})
