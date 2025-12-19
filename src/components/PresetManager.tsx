import { useState } from 'react'
import { useExpertStore } from '../stores'
import { Save, FolderOpen, Trash2, X, Edit2, Check } from 'lucide-react'

interface PresetManagerProps {
  isOpen: boolean
  onClose: () => void
}

export function PresetManager({ isOpen, onClose }: PresetManagerProps) {
  const { presets, currentPresetId, saveCurrentAsPreset, loadPreset, deletePreset, updatePreset } = useExpertStore()
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [newPresetName, setNewPresetName] = useState('')
  const [newPresetDesc, setNewPresetDesc] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  if (!isOpen) return null

  const handleSave = () => {
    if (newPresetName.trim()) {
      saveCurrentAsPreset(newPresetName.trim(), newPresetDesc.trim() || undefined)
      setNewPresetName('')
      setNewPresetDesc('')
      setShowSaveDialog(false)
    }
  }

  const handleLoad = (presetId: string) => {
    loadPreset(presetId)
    onClose()
  }

  const handleDelete = (presetId: string) => {
    deletePreset(presetId)
    setDeleteConfirmId(null)
  }

  const handleStartEdit = (presetId: string, name: string) => {
    setEditingId(presetId)
    setEditingName(name)
  }

  const handleSaveEdit = (presetId: string) => {
    if (editingName.trim()) {
      updatePreset(presetId, { name: editingName.trim() })
    }
    setEditingId(null)
    setEditingName('')
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-lg mx-4 max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">角色配置组管理</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 border-b">
          <button
            onClick={() => setShowSaveDialog(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            <Save className="w-4 h-4" />
            保存当前配置为新预设
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {presets.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <FolderOpen className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>暂无保存的配置组</p>
              <p className="text-sm">点击上方按钮保存当前配置</p>
            </div>
          ) : (
            <div className="space-y-2">
              {presets.map((preset) => (
                <div
                  key={preset.id}
                  className={`p-3 border rounded-lg ${
                    currentPresetId === preset.id ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    {editingId === preset.id ? (
                      <div className="flex-1 flex items-center gap-2">
                        <input
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          className="flex-1 px-2 py-1 border rounded"
                          autoFocus
                          onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit(preset.id)}
                        />
                        <button
                          onClick={() => handleSaveEdit(preset.id)}
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
                        <div className="flex-1">
                          <div className="font-medium">{preset.name}</div>
                          {preset.description && (
                            <div className="text-sm text-gray-500">{preset.description}</div>
                          )}
                          <div className="text-xs text-gray-400 mt-1">
                            {new Date(preset.createdAt).toLocaleString()}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleLoad(preset.id)}
                            className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                          >
                            加载
                          </button>
                          <button
                            onClick={() => handleStartEdit(preset.id, preset.name)}
                            className="p-1 text-gray-500 hover:bg-gray-100 rounded"
                            title="编辑名称"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(preset.id)}
                            className="p-1 text-red-500 hover:bg-red-100 rounded"
                            title="删除"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>

                  {deleteConfirmId === preset.id && (
                    <div className="mt-2 p-2 bg-red-50 rounded flex items-center justify-between">
                      <span className="text-sm text-red-600">确定删除此配置组？</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setDeleteConfirmId(null)}
                          className="px-2 py-1 text-sm text-gray-600 hover:bg-gray-200 rounded"
                        >
                          取消
                        </button>
                        <button
                          onClick={() => handleDelete(preset.id)}
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
              <h3 className="font-semibold text-lg mb-4">保存配置组</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    配置组名称 *
                  </label>
                  <input
                    type="text"
                    value={newPresetName}
                    onChange={(e) => setNewPresetName(e.target.value)}
                    placeholder="例如：技术讨论组"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    描述（可选）
                  </label>
                  <input
                    type="text"
                    value={newPresetDesc}
                    onChange={(e) => setNewPresetDesc(e.target.value)}
                    placeholder="简短描述此配置组的用途"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowSaveDialog(false)
                    setNewPresetName('')
                    setNewPresetDesc('')
                  }}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  取消
                </button>
                <button
                  onClick={handleSave}
                  disabled={!newPresetName.trim()}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
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
