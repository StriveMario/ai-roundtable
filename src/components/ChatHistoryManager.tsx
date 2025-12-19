import { useState } from 'react'
import { useSessionStore, useExpertStore } from '../stores'
import { History, Trash2, X, Edit2, Check, MessageSquare, Save } from 'lucide-react'

interface ChatHistoryManagerProps {
  isOpen: boolean
  onClose: () => void
}

export function ChatHistoryManager({ isOpen, onClose }: ChatHistoryManagerProps) {
  const { messages, chatHistories, currentChatId, saveCurrentChat, loadChat, deleteChat, updateChatTitle } = useSessionStore()
  const { currentPresetId } = useExpertStore()
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [newChatTitle, setNewChatTitle] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  if (!isOpen) return null

  const handleSave = () => {
    if (newChatTitle.trim()) {
      try {
        saveCurrentChat(newChatTitle.trim(), currentPresetId || undefined)
        setNewChatTitle('')
        setShowSaveDialog(false)
      } catch (error) {
        alert((error as Error).message)
      }
    }
  }

  const handleLoad = (chatId: string) => {
    loadChat(chatId)
    onClose()
  }

  const handleDelete = (chatId: string) => {
    deleteChat(chatId)
    setDeleteConfirmId(null)
  }

  const handleStartEdit = (chatId: string, title: string) => {
    setEditingId(chatId)
    setEditingTitle(title)
  }

  const handleSaveEdit = (chatId: string) => {
    if (editingTitle.trim()) {
      updateChatTitle(chatId, editingTitle.trim())
    }
    setEditingId(null)
    setEditingTitle('')
  }

  // 生成默认标题（取第一条用户消息的前20个字符）
  const generateDefaultTitle = () => {
    const userMessage = messages.find((m) => m.expertId === null)
    if (userMessage) {
      return userMessage.content.slice(0, 20) + (userMessage.content.length > 20 ? '...' : '')
    }
    return `对话 ${new Date().toLocaleString()}`
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-lg mx-4 max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">聊天记录管理</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 border-b">
          <button
            onClick={() => {
              setNewChatTitle(generateDefaultTitle())
              setShowSaveDialog(true)
            }}
            disabled={messages.length === 0}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            保存当前聊天记录
          </button>
          {messages.length === 0 && (
            <p className="text-sm text-gray-500 text-center mt-2">当前没有聊天内容可保存</p>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {chatHistories.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <History className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>暂无保存的聊天记录</p>
              <p className="text-sm">进行对话后点击上方按钮保存</p>
            </div>
          ) : (
            <div className="space-y-2">
              {chatHistories
                .sort((a, b) => b.createdAt - a.createdAt)
                .map((chat) => (
                  <div
                    key={chat.id}
                    className={`p-3 border rounded-lg ${
                      currentChatId === chat.id ? 'border-green-500 bg-green-50' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      {editingId === chat.id ? (
                        <div className="flex-1 flex items-center gap-2">
                          <input
                            type="text"
                            value={editingTitle}
                            onChange={(e) => setEditingTitle(e.target.value)}
                            className="flex-1 px-2 py-1 border rounded"
                            autoFocus
                            onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit(chat.id)}
                          />
                          <button
                            onClick={() => handleSaveEdit(chat.id)}
                            className="p-1 text-green-600 hover:bg-green-100 rounded"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="p-1 text-gray-500 hover:bg-gray-100 rounded"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{chat.title}</div>
                            <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                              <span className="flex items-center gap-1">
                                <MessageSquare className="w-3 h-3" />
                                {chat.messages.length} 条消息
                              </span>
                              <span>{new Date(chat.createdAt).toLocaleString()}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 ml-2">
                            <button
                              onClick={() => handleLoad(chat.id)}
                              className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600"
                            >
                              加载
                            </button>
                            <button
                              onClick={() => handleStartEdit(chat.id, chat.title)}
                              className="p-1 text-gray-500 hover:bg-gray-100 rounded"
                              title="编辑标题"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(chat.id)}
                              className="p-1 text-red-500 hover:bg-red-100 rounded"
                              title="删除"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>

                    {deleteConfirmId === chat.id && (
                      <div className="mt-2 p-2 bg-red-50 rounded flex items-center justify-between">
                        <span className="text-sm text-red-600">确定删除此聊天记录？</span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="px-2 py-1 text-sm text-gray-600 hover:bg-gray-200 rounded"
                          >
                            取消
                          </button>
                          <button
                            onClick={() => handleDelete(chat.id)}
                            className="px-2 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
                          >
                            删除
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          )}
        </div>

        {showSaveDialog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-sm mx-4">
              <h3 className="font-semibold text-lg mb-4">保存聊天记录</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  聊天标题 *
                </label>
                <input
                  type="text"
                  value={newChatTitle}
                  onChange={(e) => setNewChatTitle(e.target.value)}
                  placeholder="输入聊天标题"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  autoFocus
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowSaveDialog(false)
                    setNewChatTitle('')
                  }}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  取消
                </button>
                <button
                  onClick={handleSave}
                  disabled={!newChatTitle.trim()}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  保存
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
