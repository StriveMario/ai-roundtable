import { describe, it, expect, vi, beforeEach } from 'vitest'
import { streamChat, chat, testConnection, OpenAIError } from '../openai'
import { APIConfig } from '../../types'

const mockConfig: APIConfig = {
  baseUrl: 'https://api.openai.com/v1',
  apiKey: 'test-api-key',
  model: 'gpt-3.5-turbo',
  temperature: 0.7,
  maxTokens: 2048
}

describe('OpenAI Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('OpenAIError', () => {
    it('should create error with correct properties', () => {
      const error = new OpenAIError('Test error', 'test_code', 400)
      expect(error.message).toBe('Test error')
      expect(error.code).toBe('test_code')
      expect(error.status).toBe(400)
      expect(error.name).toBe('OpenAIError')
    })

    it('should work without status', () => {
      const error = new OpenAIError('Test error', 'test_code')
      expect(error.status).toBeUndefined()
    })
  })

  describe('chat', () => {
    it('should make a POST request with correct parameters', async () => {
      const mockResponse = {
        choices: [{ message: { content: 'Hello!' } }]
      }

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      } as Response)

      const result = await chat(mockConfig, [{ role: 'user', content: 'Hi' }])

      expect(fetch).toHaveBeenCalledWith(
        'https://api.openai.com/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-api-key'
          }
        })
      )
      expect(result).toBe('Hello!')
    })

    it('should throw OpenAIError on HTTP error', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: { message: 'Invalid API key', code: 'invalid_api_key' } })
      } as Response)

      await expect(chat(mockConfig, [{ role: 'user', content: 'Hi' }]))
        .rejects.toThrow(OpenAIError)
    })

    it('should handle empty response', async () => {
      const mockResponse = {
        choices: [{ message: {} }]
      }

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      } as Response)

      const result = await chat(mockConfig, [{ role: 'user', content: 'Hi' }])
      expect(result).toBe('')
    })
  })

  describe('testConnection', () => {
    it('should return true on successful connection', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ choices: [{ message: { content: 'Hi' } }] })
      } as Response)

      const result = await testConnection(mockConfig)
      expect(result).toBe(true)
    })

    it('should return false on failed connection', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: { message: 'Unauthorized' } })
      } as Response)

      const result = await testConnection(mockConfig)
      expect(result).toBe(false)
    })

    it('should return false on network error', async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'))

      const result = await testConnection(mockConfig)
      expect(result).toBe(false)
    })
  })

  describe('streamChat', () => {
    it('should handle streaming response', async () => {
      const chunks = [
        'data: {"choices":[{"delta":{"content":"Hello"}}]}\n\n',
        'data: {"choices":[{"delta":{"content":" World"}}]}\n\n',
        'data: [DONE]\n\n'
      ]

      const encoder = new TextEncoder()
      let chunkIndex = 0

      const mockReader = {
        read: vi.fn().mockImplementation(() => {
          if (chunkIndex < chunks.length) {
            const chunk = chunks[chunkIndex++]
            return Promise.resolve({ done: false, value: encoder.encode(chunk) })
          }
          return Promise.resolve({ done: true, value: undefined })
        })
      }

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        body: { getReader: () => mockReader }
      } as unknown as Response)

      const receivedChunks: string[] = []
      const onChunk = vi.fn((chunk: string, done: boolean) => {
        if (!done) receivedChunks.push(chunk)
      })

      const result = await streamChat(mockConfig, [{ role: 'user', content: 'Hi' }], onChunk)

      expect(result).toBe('Hello World')
      expect(receivedChunks).toEqual(['Hello', ' World'])
    })

    it('should throw OpenAIError on HTTP error', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: { message: 'Server error', code: 'server_error' } })
      } as Response)

      const onChunk = vi.fn()

      await expect(streamChat(mockConfig, [{ role: 'user', content: 'Hi' }], onChunk))
        .rejects.toThrow(OpenAIError)
    })

    it('should throw OpenAIError when no response body', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        body: null
      } as unknown as Response)

      const onChunk = vi.fn()

      await expect(streamChat(mockConfig, [{ role: 'user', content: 'Hi' }], onChunk))
        .rejects.toThrow('No response body')
    })

    it('should handle abort signal', async () => {
      const abortController = new AbortController()
      abortController.abort()

      vi.mocked(fetch).mockRejectedValueOnce(Object.assign(new Error('Aborted'), { name: 'AbortError' }))

      const onChunk = vi.fn()

      await expect(streamChat(mockConfig, [{ role: 'user', content: 'Hi' }], onChunk, abortController.signal))
        .rejects.toThrow('Request aborted')
    })
  })
})
