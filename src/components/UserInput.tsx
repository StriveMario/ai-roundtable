import { useState, useRef, useEffect } from 'react'
import { Send, Square } from 'lucide-react'

interface UserInputProps {
  onSubmit: (content: string) => void
  onStop: () => void
  isDiscussing: boolean
  disabled?: boolean
}

export function UserInput({ onSubmit, onStop, isDiscussing, disabled }: UserInputProps) {
  const [content, setContent] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`
    }
  }, [content])

  const handleSubmit = () => {
    if (content.trim() && !disabled && !isDiscussing) {
      onSubmit(content.trim())
      setContent('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="border-t bg-white p-4">
      <div className="flex gap-3 items-end max-w-4xl mx-auto">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isDiscussing ? '讨论进行中...' : '输入你的问题，让AI角色们讨论...'}
          disabled={disabled || isDiscussing}
          rows={1}
          className="flex-1 px-4 py-3 border rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
        />
        {isDiscussing ? (
          <button
            onClick={onStop}
            className="px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 flex items-center gap-2"
          >
            <Square className="w-4 h-4" />
            停止
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={!content.trim() || disabled}
            className="px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            发送
          </button>
        )}
      </div>
      <p className="text-xs text-gray-400 text-center mt-2">
        按 Enter 发送，Shift + Enter 换行
      </p>
    </div>
  )
}
