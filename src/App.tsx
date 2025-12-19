import { useState } from 'react'
import { Header, ExpertPanel, ChatInterface, APISettings, PresetManager, ChatHistoryManager } from './components'
import { useSessionStore } from './stores'

function App() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isPresetsOpen, setIsPresetsOpen] = useState(false)
  const [isChatHistoryOpen, setIsChatHistoryOpen] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)

  const { messages, resetRoundtable, clearMessages } = useSessionStore()

  const handleNewChat = () => {
    resetRoundtable()
  }

  const handleClearHistory = () => {
    if (window.confirm('确定要清空所有聊天记录吗？此操作不可恢复。')) {
      clearMessages()
      resetRoundtable()
    }
  }

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Header */}
      <Header
        onOpenSettings={() => setIsSettingsOpen(true)}
        onToggleSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        onNewChat={handleNewChat}
        onClearHistory={handleClearHistory}
        onOpenPresets={() => setIsPresetsOpen(true)}
        onOpenChatHistory={() => setIsChatHistoryOpen(true)}
        hasMessages={messages.length > 0}
      />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Desktop */}
        <div
          className={`hidden lg:block transition-all duration-300 ${
            isSidebarCollapsed ? 'w-16' : 'w-80'
          }`}
        >
          <ExpertPanel
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          />
        </div>

        {/* Sidebar - Mobile Overlay */}
        {isMobileSidebarOpen && (
          <>
            <div
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={() => setIsMobileSidebarOpen(false)}
            />
            <div className="fixed inset-y-0 left-0 w-80 z-50 lg:hidden">
              <ExpertPanel
                isCollapsed={false}
                onToggleCollapse={() => setIsMobileSidebarOpen(false)}
              />
            </div>
          </>
        )}

        {/* Chat Area */}
        <div className="flex-1 bg-white">
          <ChatInterface />
        </div>
      </div>

      {/* API Settings Modal */}
      <APISettings
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      {/* Preset Manager Modal */}
      <PresetManager
        isOpen={isPresetsOpen}
        onClose={() => setIsPresetsOpen(false)}
      />

      {/* Chat History Manager Modal */}
      <ChatHistoryManager
        isOpen={isChatHistoryOpen}
        onClose={() => setIsChatHistoryOpen(false)}
      />
    </div>
  )
}

export default App
