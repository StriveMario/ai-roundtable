import { Expert } from '../types'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'

interface ExpertCardProps {
  expert: Expert
  index: number
  onUpdate: (updates: Partial<Expert>) => void
}

export function ExpertCard({ expert, index, onUpdate }: ExpertCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div
      className="border rounded-lg overflow-hidden bg-white shadow-sm"
      style={{ borderLeftColor: expert.color, borderLeftWidth: '4px' }}
    >
      <div
        className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
            style={{ backgroundColor: expert.color }}
          >
            {String.fromCharCode(65 + index)}
          </div>
          <div>
            <input
              type="text"
              value={expert.name}
              onChange={(e) => onUpdate({ name: e.target.value })}
              onClick={(e) => e.stopPropagation()}
              className="font-medium text-gray-900 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none"
            />
            <input
              type="text"
              value={expert.role}
              onChange={(e) => onUpdate({ role: e.target.value })}
              onClick={(e) => e.stopPropagation()}
              className="block text-sm text-gray-500 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        )}
      </div>

      {isExpanded && (
        <div className="p-3 pt-0 border-t">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            系统提示词
          </label>
          <textarea
            value={expert.systemPrompt}
            onChange={(e) => onUpdate({ systemPrompt: e.target.value })}
            rows={4}
            className="w-full px-3 py-2 text-sm border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            placeholder="输入专家的系统提示词..."
          />
        </div>
      )}
    </div>
  )
}
