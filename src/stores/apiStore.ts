import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  APIConfig,
  DEFAULT_API_CONFIG,
  APISite,
  SiteHealth,
  LoadBalancerConfig,
  DEFAULT_LOAD_BALANCER_CONFIG,
  siteToConfig,
} from '../types'

// 生成唯一ID
const generateId = () => Math.random().toString(36).substring(2, 9)

// 创建默认站点（从旧配置迁移时使用）
const createDefaultSite = (config: APIConfig): APISite => ({
  id: generateId(),
  name: '默认站点',
  baseUrl: config.baseUrl,
  apiKey: config.apiKey,
  model: config.model,
  temperature: config.temperature,
  maxTokens: config.maxTokens,
  enabled: true,
  priority: 1,
})

interface APIStore {
  // 多站点配置
  sites: APISite[]
  siteHealth: Record<string, SiteHealth>
  loadBalancerConfig: LoadBalancerConfig
  currentSiteIndex: number

  // 兼容性：当前活跃配置（从第一个健康站点获取）
  config: APIConfig
  isConfigured: boolean

  // 站点管理
  addSite: (site: Omit<APISite, 'id'>) => string
  updateSite: (id: string, updates: Partial<APISite>) => void
  removeSite: (id: string) => void
  toggleSite: (id: string) => void
  reorderSites: (siteIds: string[]) => void

  // 健康状态管理
  markSiteFailure: (siteId: string) => void
  markSiteSuccess: (siteId: string) => void
  resetSiteHealth: (siteId: string) => void
  resetAllSiteHealth: () => void

  // 负载均衡
  getNextSite: () => APISite | null
  getHealthySites: () => APISite[]
  setLoadBalancerConfig: (config: Partial<LoadBalancerConfig>) => void

  // 兼容旧API
  setConfig: (config: Partial<APIConfig>) => void
  resetConfig: () => void
  setApiKey: (apiKey: string) => void
  setBaseUrl: (baseUrl: string) => void
  setModel: (model: string) => void
  setTemperature: (temperature: number) => void
}

// 计算站点健康状态
const calculateSiteStatus = (
  health: SiteHealth,
  config: LoadBalancerConfig
): SiteHealth['status'] => {
  if (health.failureCount >= config.maxFailures) {
    // 检查是否可以恢复
    if (health.lastFailure) {
      const timeSinceFailure = Date.now() - health.lastFailure
      if (timeSinceFailure >= config.recoveryTime) {
        return 'degraded' // 可以尝试恢复
      }
    }
    return 'unhealthy'
  }
  if (health.failureCount > 0) {
    return 'degraded'
  }
  return 'healthy'
}

// 初始化站点健康状态
const initSiteHealth = (siteId: string): SiteHealth => ({
  siteId,
  failureCount: 0,
  status: 'healthy',
})

export const useAPIStore = create<APIStore>()(
  persist(
    (set, get) => ({
      // 初始状态
      sites: [],
      siteHealth: {},
      loadBalancerConfig: DEFAULT_LOAD_BALANCER_CONFIG,
      currentSiteIndex: 0,
      config: DEFAULT_API_CONFIG,
      isConfigured: false,

      // 添加站点
      addSite: (siteData) => {
        const id = generateId()
        const newSite: APISite = { ...siteData, id }

        set((state) => {
          const newSites = [...state.sites, newSite]
          const newHealth = {
            ...state.siteHealth,
            [id]: initSiteHealth(id),
          }

          // 更新兼容性config
          const firstEnabledSite = newSites.find((s) => s.enabled)
          const config = firstEnabledSite
            ? siteToConfig(firstEnabledSite)
            : DEFAULT_API_CONFIG

          return {
            sites: newSites,
            siteHealth: newHealth,
            config,
            isConfigured: !!firstEnabledSite?.apiKey && !!firstEnabledSite?.baseUrl,
          }
        })

        return id
      },

      // 更新站点
      updateSite: (id, updates) => {
        set((state) => {
          const newSites = state.sites.map((site) =>
            site.id === id ? { ...site, ...updates } : site
          )

          // 更新兼容性config
          const firstEnabledSite = newSites.find((s) => s.enabled)
          const config = firstEnabledSite
            ? siteToConfig(firstEnabledSite)
            : DEFAULT_API_CONFIG

          return {
            sites: newSites,
            config,
            isConfigured: !!firstEnabledSite?.apiKey && !!firstEnabledSite?.baseUrl,
          }
        })
      },

      // 删除站点
      removeSite: (id) => {
        set((state) => {
          const newSites = state.sites.filter((site) => site.id !== id)
          const { [id]: _, ...newHealth } = state.siteHealth

          // 更新兼容性config
          const firstEnabledSite = newSites.find((s) => s.enabled)
          const config = firstEnabledSite
            ? siteToConfig(firstEnabledSite)
            : DEFAULT_API_CONFIG

          return {
            sites: newSites,
            siteHealth: newHealth,
            config,
            isConfigured: !!firstEnabledSite?.apiKey && !!firstEnabledSite?.baseUrl,
            currentSiteIndex: 0, // 重置索引
          }
        })
      },

      // 切换站点启用状态
      toggleSite: (id) => {
        set((state) => {
          const newSites = state.sites.map((site) =>
            site.id === id ? { ...site, enabled: !site.enabled } : site
          )

          // 更新兼容性config
          const firstEnabledSite = newSites.find((s) => s.enabled)
          const config = firstEnabledSite
            ? siteToConfig(firstEnabledSite)
            : DEFAULT_API_CONFIG

          return {
            sites: newSites,
            config,
            isConfigured: !!firstEnabledSite?.apiKey && !!firstEnabledSite?.baseUrl,
          }
        })
      },

      // 重新排序站点
      reorderSites: (siteIds) => {
        set((state) => {
          const siteMap = new Map(state.sites.map((s) => [s.id, s]))
          const newSites = siteIds
            .map((id, index) => {
              const site = siteMap.get(id)
              return site ? { ...site, priority: index + 1 } : null
            })
            .filter((s): s is APISite => s !== null)

          return { sites: newSites }
        })
      },

      // 标记站点失败
      markSiteFailure: (siteId) => {
        set((state) => {
          const currentHealth = state.siteHealth[siteId] || initSiteHealth(siteId)
          const newHealth: SiteHealth = {
            ...currentHealth,
            failureCount: currentHealth.failureCount + 1,
            lastFailure: Date.now(),
            status: 'healthy', // 临时值，下面会重新计算
          }
          newHealth.status = calculateSiteStatus(newHealth, state.loadBalancerConfig)

          return {
            siteHealth: {
              ...state.siteHealth,
              [siteId]: newHealth,
            },
          }
        })
      },

      // 标记站点成功
      markSiteSuccess: (siteId) => {
        set((state) => ({
          siteHealth: {
            ...state.siteHealth,
            [siteId]: {
              siteId,
              failureCount: 0,
              lastSuccess: Date.now(),
              status: 'healthy',
            },
          },
        }))
      },

      // 重置单个站点健康状态
      resetSiteHealth: (siteId) => {
        set((state) => ({
          siteHealth: {
            ...state.siteHealth,
            [siteId]: initSiteHealth(siteId),
          },
        }))
      },

      // 重置所有站点健康状态
      resetAllSiteHealth: () => {
        set((state) => {
          const newHealth: Record<string, SiteHealth> = {}
          state.sites.forEach((site) => {
            newHealth[site.id] = initSiteHealth(site.id)
          })
          return { siteHealth: newHealth, currentSiteIndex: 0 }
        })
      },

      // 获取健康的站点列表
      getHealthySites: () => {
        const state = get()
        return state.sites.filter((site) => {
          if (!site.enabled) return false
          const health = state.siteHealth[site.id]
          if (!health) return true // 没有健康记录视为健康
          return health.status !== 'unhealthy'
        })
      },

      // 获取下一个可用站点（负载均衡）
      getNextSite: () => {
        const state = get()
        const healthySites = state.getHealthySites()

        if (healthySites.length === 0) return null

        let selectedSite: APISite

        switch (state.loadBalancerConfig.strategy) {
          case 'priority':
            // 按优先级排序，选择优先级最高的
            selectedSite = [...healthySites].sort(
              (a, b) => a.priority - b.priority
            )[0]
            break

          case 'random':
            // 随机选择
            selectedSite =
              healthySites[Math.floor(Math.random() * healthySites.length)]
            break

          case 'round-robin':
          default:
            // 轮询
            const index = state.currentSiteIndex % healthySites.length
            selectedSite = healthySites[index]
            set({ currentSiteIndex: state.currentSiteIndex + 1 })
            break
        }

        return selectedSite
      },

      // 设置负载均衡配置
      setLoadBalancerConfig: (config) => {
        set((state) => ({
          loadBalancerConfig: { ...state.loadBalancerConfig, ...config },
        }))
      },

      // 兼容旧API：设置配置（更新第一个站点或创建新站点）
      setConfig: (updates) => {
        set((state) => {
          if (state.sites.length === 0) {
            // 没有站点，创建一个
            const newConfig = { ...DEFAULT_API_CONFIG, ...updates }
            const newSite = createDefaultSite(newConfig)
            return {
              sites: [newSite],
              siteHealth: { [newSite.id]: initSiteHealth(newSite.id) },
              config: newConfig,
              isConfigured: !!newConfig.apiKey && !!newConfig.baseUrl,
            }
          }

          // 更新第一个站点
          const firstSite = state.sites[0]
          const updatedSite: APISite = {
            ...firstSite,
            baseUrl: updates.baseUrl ?? firstSite.baseUrl,
            apiKey: updates.apiKey ?? firstSite.apiKey,
            model: updates.model ?? firstSite.model,
            temperature: updates.temperature ?? firstSite.temperature,
            maxTokens: updates.maxTokens ?? firstSite.maxTokens,
          }

          const newSites = [updatedSite, ...state.sites.slice(1)]
          const newConfig = siteToConfig(updatedSite)

          return {
            sites: newSites,
            config: newConfig,
            isConfigured: !!newConfig.apiKey && !!newConfig.baseUrl,
          }
        })
      },

      // 兼容旧API：重置配置
      resetConfig: () => {
        set({
          sites: [],
          siteHealth: {},
          config: DEFAULT_API_CONFIG,
          isConfigured: false,
          currentSiteIndex: 0,
        })
      },

      // 兼容旧API
      setApiKey: (apiKey) => get().setConfig({ apiKey }),
      setBaseUrl: (baseUrl) => get().setConfig({ baseUrl }),
      setModel: (model) => get().setConfig({ model }),
      setTemperature: (temperature) => get().setConfig({ temperature }),
    }),
    {
      name: 'roundtable-api-config',
      version: 2,
      migrate: (persistedState: unknown, version: number) => {
        if (version === 1 || version === 0) {
          // 从旧版本迁移
          const oldState = persistedState as {
            config?: APIConfig
            isConfigured?: boolean
          }

          if (oldState.config && oldState.config.apiKey) {
            // 将旧配置转换为站点
            const site = createDefaultSite(oldState.config)
            return {
              sites: [site],
              siteHealth: { [site.id]: initSiteHealth(site.id) },
              loadBalancerConfig: DEFAULT_LOAD_BALANCER_CONFIG,
              currentSiteIndex: 0,
              config: oldState.config,
              isConfigured: oldState.isConfigured ?? false,
            }
          }
        }
        return persistedState
      },
    }
  )
)
