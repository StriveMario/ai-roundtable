import { Message, Expert } from '../types'
import { Loader2 } from 'lucide-react'
import MarkdownPreview from '@uiw/react-markdown-preview'

interface ExpertMessageProps {
  message: Message
  expert: Expert | undefined
  isStreaming?: boolean
}

export function ExpertMessage({ message, expert, isStreaming }: ExpertMessageProps) {
  if (!expert) return null

  const initial = expert.name.charAt(0).toUpperCase()

  return (
    <div className="flex gap-3 p-4">
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
        style={{ backgroundColor: expert.color }}
      >
        {initial}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-gray-900">{expert.name}</span>
          <span className="text-sm text-gray-500">({expert.role})</span>
          <span className="text-xs text-gray-400">
            第 {message.round} 轮
          </span>
        </div>
        <div className="text-gray-700 break-words">
          {message.content ? (
            <>
              <MarkdownPreview
                source={message.content}
                style={{
                  backgroundColor: 'transparent',
                  fontSize: '14px',
                  lineHeight: '1.6'
                }}
                wrapperElement={{
                  "data-color-mode": "light"
                }}
              />
              {isStreaming && (
                <span className="inline-block w-2 h-4 bg-gray-400 animate-pulse ml-0.5" />
              )}
            </>
          ) : (
            <span className="flex items-center gap-2 text-gray-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              思考中...
            </span>
          )}
        </div>
        <div className="text-xs text-gray-400 mt-1">
          {new Date(message.timestamp).toLocaleTimeString()}
        </div>
      </div>
    </div>
  )
}
