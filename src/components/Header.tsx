import { Settings, Menu, Plus, Trash2, Users, History } from 'lucide-react'

interface HeaderProps {
  onOpenSettings: () => void
  onToggleSidebar: () => void
  onNewChat: () => void
  onClearHistory: () => void
  onOpenPresets: () => void
  onOpenChatHistory: () => void
  hasMessages: boolean
}

export function Header({ onOpenSettings, onToggleSidebar, onNewChat, onClearHistory, onOpenPresets, onOpenChatHistory, hasMessages }: HeaderProps) {
  return (
    <header className="h-14 bg-white border-b flex items-center justify-between px-4">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 hover:bg-gray-100 rounded-lg lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold text-gray-900">
          AI头脑风暴
        </h1>
        <span className="text-sm text-gray-500 hidden sm:inline">
          多角色讨论平台
        </span>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onNewChat}
          className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-500 text-white hover:bg-blue-600 rounded-lg"
          title="新聊天"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">新聊天</span>
        </button>
        {hasMessages && (
          <button
            onClick={onClearHistory}
            className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg"
            title="清空记录"
          >
            <Trash2 className="w-4 h-4" />
            <span className="hidden sm:inline">清空</span>
          </button>
        )}
        <button
          onClick={onOpenChatHistory}
          className="p-2 hover:bg-gray-100 rounded-lg"
          title="聊天记录"
        >
          <History className="w-5 h-5" />
        </button>
        <button
          onClick={onOpenPresets}
          className="p-2 hover:bg-gray-100 rounded-lg"
          title="角色配置组"
        >
          <Users className="w-5 h-5" />
        </button>
        <button
          onClick={onOpenSettings}
          className="p-2 hover:bg-gray-100 rounded-lg"
          title="API 设置"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>
    </header>
  )
}
