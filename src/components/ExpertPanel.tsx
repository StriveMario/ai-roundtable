import { useExpertStore } from '../stores'
import { ExpertCard } from './ExpertCard'
import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react'
import { useState } from 'react'

interface ExpertPanelProps {
  isCollapsed?: boolean
  onToggleCollapse?: () => void
}

export function ExpertPanel({ isCollapsed = false, onToggleCollapse }: ExpertPanelProps) {
  const { experts, updateExpert, resetExperts } = useExpertStore()
  const [showResetConfirm, setShowResetConfirm] = useState(false)

  const handleReset = () => {
    resetExperts()
    setShowResetConfirm(false)
  }

  if (isCollapsed) {
    return (
      <div className="h-full flex flex-col items-center py-4 bg-gray-50 border-r">
        <button
          onClick={onToggleCollapse}
          className="p-2 hover:bg-gray-200 rounded-lg"
          title="展开角色面板"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
        <div className="mt-4 flex flex-col gap-2">
          {experts.map((expert, index) => (
            <div
              key={expert.id}
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
              style={{ backgroundColor: expert.color }}
              title={`${expert.name} - ${expert.role}`}
            >
              {String.fromCharCode(65 + index)}
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-gray-50 border-r">
      <div className="flex items-center justify-between p-4 border-b bg-white">
        <h2 className="font-semibold text-gray-900">角色配置</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowResetConfirm(true)}
            className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"
            title="重置为默认配置"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={onToggleCollapse}
            className="p-2 hover:bg-gray-100 rounded-lg"
            title="收起面板"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {experts.map((expert, index) => (
          <ExpertCard
            key={expert.id}
            expert={expert}
            index={index}
            onUpdate={(updates) => updateExpert(expert.id, updates)}
          />
        ))}
      </div>

      {showResetConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
            <h3 className="font-semibold text-lg mb-2">确认重置</h3>
            <p className="text-gray-600 mb-4">
              确定要将所有角色配置重置为默认值吗？此操作不可撤销。
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                取消
              </button>
              <button
                onClick={handleReset}
                className="px-4 py-2 bg-red-500 text-white hover:bg-red-600 rounded-lg"
              >
                重置
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
