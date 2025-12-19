import { useState } from 'react'
import { useAPIStore } from '../stores'
import { AVAILABLE_MODELS, APISite, LoadBalancerStrategy, SiteHealth } from '../types'
import { testSiteConnection, testAllSitesConnection } from '../services'
import { X, Eye, EyeOff, Check, Loader2, Plus, Trash2, ChevronUp, ChevronDown, Power, RefreshCw, Activity } from 'lucide-react'

interface APISettingsProps {
  isOpen: boolean
  onClose: () => void
}

// 站点表单数据
interface SiteFormData {
  name: string
  baseUrl: string
  apiKey: string
  model: string
  temperature: number
  enabled: boolean
  priority: number
}

const defaultSiteForm: SiteFormData = {
  name: '',
  baseUrl: 'https://api.openai.com/v1',
  apiKey: '',
  model: 'gpt-4',
  temperature: 0.7,
  enabled: true,
  priority: 1,
}

// 格式化时间戳
function formatTime(timestamp?: number): string {
  if (!timestamp) return '-'
  const date = new Date(timestamp)
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// 健康状态指示器组件
function HealthIndicator({ health }: { health?: SiteHealth }) {
  if (!health) {
    return <span className="w-2 h-2 rounded-full bg-gray-300" title="未知状态" />
  }

  const colorMap: Record<string, string> = {
    healthy: 'bg-green-500',
    degraded: 'bg-yellow-500',
    unhealthy: 'bg-red-500',
  }

  const labelMap: Record<string, string> = {
    healthy: '健康',
    degraded: '降级',
    unhealthy: '不健康',
  }

  const color = colorMap[health.status] || 'bg-gray-300'
  const label = labelMap[health.status] || '未知'

  return (
    <span
      className={'w-2 h-2 rounded-full ' + color}
      title={label + ' - 失败次数: ' + health.failureCount}
    />
  )
}

export function APISettings({ isOpen, onClose }: APISettingsProps) {
  const {
    sites,
    siteHealth,
    loadBalancerConfig,
    addSite,
    updateSite,
    removeSite,
    toggleSite,
    reorderSites,
    setLoadBalancerConfig,
    resetSiteHealth,
    resetAllSiteHealth,
  } = useAPIStore()

  const [editingSite, setEditingSite] = useState<string | null>(null)
  const [siteForm, setSiteForm] = useState<SiteFormData>(defaultSiteForm)
  const [showApiKey, setShowApiKey] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [testingId, setTestingId] = useState<string | null>(null)
  const [testResults, setTestResults] = useState<Record<string, boolean>>({})
  const [isCustomModel, setIsCustomModel] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [isBatchTesting, setIsBatchTesting] = useState(false)
  const [showHealthDetails, setShowHealthDetails] = useState(false)

  // 开始添加新站点
  const handleStartAdd = () => {
    setSiteForm({
      ...defaultSiteForm,
      priority: sites.length + 1,
    })
    setIsAdding(true)
    setEditingSite(null)
    setIsCustomModel(false)
  }

  // 开始编辑站点
  const handleStartEdit = (site: APISite) => {
    setSiteForm({
      name: site.name,
      baseUrl: site.baseUrl,
      apiKey: site.apiKey,
      model: site.model,
      temperature: site.temperature,
      enabled: site.enabled,
      priority: site.priority,
    })
    setEditingSite(site.id)
    setIsAdding(false)
    setIsCustomModel(!AVAILABLE_MODELS.includes(site.model as typeof AVAILABLE_MODELS[number]))
  }

  // 保存站点
  const handleSave = () => {
    if (isAdding) {
      addSite(siteForm)
    } else if (editingSite) {
      updateSite(editingSite, siteForm)
    }
    handleCancel()
  }

  // 取消编辑
  const handleCancel = () => {
    setIsAdding(false)
    setEditingSite(null)
    setSiteForm(defaultSiteForm)
    setShowApiKey(false)
    setIsCustomModel(false)
  }

  // 删除站点
  const handleDelete = (id: string) => {
    if (deleteConfirm === id) {
      removeSite(id)
      setDeleteConfirm(null)
    } else {
      setDeleteConfirm(id)
      setTimeout(() => setDeleteConfirm(null), 3000)
    }
  }

  // 移动站点顺序
  const handleMove = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= sites.length) return

    const newOrder = [...sites]
    const temp = newOrder[index]
    newOrder[index] = newOrder[newIndex]
    newOrder[newIndex] = temp
    reorderSites(newOrder.map((s) => s.id))
  }

  // 测试站点连接
  const handleTestSite = async (site: APISite) => {
    setTestingId(site.id)
    try {
      const success = await testSiteConnection(site)
      setTestResults((prev) => ({ ...prev, [site.id]: success }))
    } catch {
      setTestResults((prev) => ({ ...prev, [site.id]: false }))
    } finally {
      setTestingId(null)
    }
  }

  // 批量测试所有站点
  const handleBatchTest = async () => {
    setIsBatchTesting(true)
    try {
      const results = await testAllSitesConnection(sites)
      const newResults: Record<string, boolean> = {}
      results.forEach((success, siteId) => {
        newResults[siteId] = success
      })
      setTestResults(newResults)
    } catch {
      // 忽略错误
    } finally {
      setIsBatchTesting(false)
    }
  }

  if (!isOpen) return null

  const isEditing = isAdding || editingSite !== null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">API 站点管理</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* 负载均衡策略 */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              负载均衡策略
            </label>
            <select
              value={loadBalancerConfig.strategy}
              onChange={(e) =>
                setLoadBalancerConfig({ strategy: e.target.value as LoadBalancerStrategy })
              }
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="round-robin">轮询 (Round Robin)</option>
              <option value="priority">优先级 (Priority)</option>
              <option value="random">随机 (Random)</option>
            </select>
            <p className="mt-1 text-xs text-gray-500">
              {loadBalancerConfig.strategy === 'round-robin' && '依次使用每个站点'}
              {loadBalancerConfig.strategy === 'priority' && '优先使用排序靠前的站点'}
              {loadBalancerConfig.strategy === 'random' && '随机选择可用站点'}
            </p>
          </div>

          {/* 站点列表头部 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-medium text-gray-700">站点列表</h3>
                <button
                  onClick={() => setShowHealthDetails(!showHealthDetails)}
                  className={'p-1 rounded text-xs ' + (showHealthDetails ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100 text-gray-500')}
                  title="显示健康详情"
                >
                  <Activity className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-center gap-2">
                {sites.length > 0 && (
                  <>
                    <button
                      onClick={handleBatchTest}
                      disabled={isBatchTesting || isEditing}
                      className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 disabled:opacity-50 rounded"
                      title="测试所有站点"
                    >
                      {isBatchTesting ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <RefreshCw className="w-3 h-3" />
                      )}
                      批量测试
                    </button>
                    <button
                      onClick={resetAllSiteHealth}
                      disabled={isEditing}
                      className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 disabled:opacity-50 rounded"
                      title="重置所有健康状态"
                    >
                      重置状态
                    </button>
                  </>
                )}
                <button
                  onClick={handleStartAdd}
                  disabled={isEditing}
                  className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 rounded-lg"
                >
                  <Plus className="w-4 h-4" />
                  添加站点
                </button>
              </div>
            </div>

            {sites.length === 0 ? (
              <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                <p>暂无站点配置</p>
                <p className="text-sm mt-1">点击上方按钮添加第一个站点</p>
              </div>
            ) : (
              <div className="space-y-2">
                {sites.map((site, index) => {
                  const health = siteHealth[site.id]
                  return (
                    <div
                      key={site.id}
                      className={`border rounded-lg p-3 ${
                        editingSite === site.id ? 'border-blue-500 bg-blue-50' : ''
                      } ${!site.enabled ? 'opacity-60' : ''}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex flex-col gap-1">
                            <button
                              onClick={() => handleMove(index, 'up')}
                              disabled={index === 0 || isEditing}
                              className="p-0.5 hover:bg-gray-200 rounded disabled:opacity-30"
                            >
                              <ChevronUp className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleMove(index, 'down')}
                              disabled={index === sites.length - 1 || isEditing}
                              className="p-0.5 hover:bg-gray-200 rounded disabled:opacity-30"
                            >
                              <ChevronDown className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="flex items-center gap-2">
                            <HealthIndicator health={health} />
                            <div>
                              <div className="font-medium">{site.name || '未命名站点'}</div>
                              <div className="text-sm text-gray-500 truncate max-w-xs">
                                {site.baseUrl}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {testResults[site.id] !== undefined && (
                            <span className={testResults[site.id] ? 'text-green-500' : 'text-red-500'}>
                              {testResults[site.id] ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                            </span>
                          )}
                          <button
                            onClick={() => handleTestSite(site)}
                            disabled={testingId === site.id || isEditing}
                            className="p-1.5 hover:bg-gray-100 rounded disabled:opacity-50"
                            title="测试连接"
                          >
                            {testingId === site.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Check className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => toggleSite(site.id)}
                            disabled={isEditing}
                            className={`p-1.5 rounded ${
                              site.enabled ? 'text-green-500 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-100'
                            }`}
                            title={site.enabled ? '禁用站点' : '启用站点'}
                          >
                            <Power className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleStartEdit(site)}
                            disabled={isEditing}
                            className="px-2 py-1 text-sm text-blue-500 hover:bg-blue-50 rounded disabled:opacity-50"
                          >
                            编辑
                          </button>
                          <button
                            onClick={() => handleDelete(site.id)}
                            disabled={isEditing}
                            className={`p-1.5 rounded ${
                              deleteConfirm === site.id
                                ? 'bg-red-500 text-white'
                                : 'text-red-500 hover:bg-red-50'
                            } disabled:opacity-50`}
                            title={deleteConfirm === site.id ? '再次点击确认删除' : '删除站点'}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      {/* 健康详情 */}
                      {showHealthDetails && health && (
                        <div className="mt-2 pt-2 border-t text-xs text-gray-500 flex items-center gap-4">
                          <span>失败次数: {health.failureCount}</span>
                          <span>最后成功: {formatTime(health.lastSuccess)}</span>
                          <span>最后失败: {formatTime(health.lastFailure)}</span>
                          <button
                            onClick={() => resetSiteHealth(site.id)}
                            className="text-blue-500 hover:underline"
                          >
                            重置
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* 站点编辑表单 */}
          {isEditing && (
            <div className="border-t pt-4 mt-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3">
                {isAdding ? '添加新站点' : '编辑站点'}
              </h3>
              <div className="space-y-3">
                {/* 站点名称 */}
                <div>
                  <label className="block text-sm text-gray-600 mb-1">站点名称</label>
                  <input
                    type="text"
                    value={siteForm.name}
                    onChange={(e) => setSiteForm({ ...siteForm, name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="例如：主站点、备用站点"
                  />
                </div>

                {/* Base URL */}
                <div>
                  <label className="block text-sm text-gray-600 mb-1">API Base URL</label>
                  <input
                    type="text"
                    value={siteForm.baseUrl}
                    onChange={(e) => setSiteForm({ ...siteForm, baseUrl: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="https://api.openai.com/v1"
                  />
                </div>

                {/* API Key */}
                <div>
                  <label className="block text-sm text-gray-600 mb-1">API Key</label>
                  <div className="relative flex items-center">
                    <input
                      type={showApiKey ? 'text' : 'password'}
                      value={siteForm.apiKey}
                      onChange={(e) => setSiteForm({ ...siteForm, apiKey: e.target.value })}
                      className="w-full px-3 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="sk-..."
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-2 p-2 hover:bg-gray-100 rounded"
                    >
                      {showApiKey ? (
                        <EyeOff className="w-4 h-4 text-gray-500" />
                      ) : (
                        <Eye className="w-4 h-4 text-gray-500" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Model */}
                <div>
                  <label className="block text-sm text-gray-600 mb-1">模型</label>
                  <select
                    value={isCustomModel ? 'custom' : siteForm.model}
                    onChange={(e) => {
                      if (e.target.value === 'custom') {
                        setIsCustomModel(true)
                      } else {
                        setIsCustomModel(false)
                        setSiteForm({ ...siteForm, model: e.target.value })
                      }
                    }}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {AVAILABLE_MODELS.map((model) => (
                      <option key={model} value={model}>
                        {model}
                      </option>
                    ))}
                    <option value="custom">自定义模型</option>
                  </select>
                  {isCustomModel && (
                    <input
                      type="text"
                      value={siteForm.model}
                      onChange={(e) => setSiteForm({ ...siteForm, model: e.target.value })}
                      className="mt-2 w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="输入自定义模型名称"
                    />
                  )}
                </div>

                {/* Temperature */}
                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    Temperature: {siteForm.temperature}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="2"
                    step="0.1"
                    value={siteForm.temperature}
                    onChange={(e) =>
                      setSiteForm({ ...siteForm, temperature: parseFloat(e.target.value) })
                    }
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>精确 (0)</span>
                    <span>创意 (2)</span>
                  </div>
                </div>

                {/* 操作按钮 */}
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={handleCancel}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={!siteForm.baseUrl || !siteForm.apiKey}
                    className="px-4 py-2 bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 rounded-lg"
                  >
                    {isAdding ? '添加' : '保存'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 p-4 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-500 text-white hover:bg-blue-600 rounded-lg"
          >
            完成
          </button>
        </div>
      </div>
    </div>
  )
}
