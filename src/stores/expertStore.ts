import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Expert, ExpertPreset, createDefaultExperts, createExpertPreset } from '../types'

interface ExpertStore {
  experts: Expert[]
  presets: ExpertPreset[]
  currentPresetId: string | null
  // Expert Actions
  setExperts: (experts: Expert[]) => void
  updateExpert: (id: string, updates: Partial<Expert>) => void
  resetExperts: () => void
  getExpertById: (id: string) => Expert | undefined
  // Preset Actions
  saveCurrentAsPreset: (name: string, description?: string) => ExpertPreset
  loadPreset: (presetId: string) => void
  deletePreset: (presetId: string) => void
  updatePreset: (presetId: string, updates: Partial<Pick<ExpertPreset, 'name' | 'description'>>) => void
  getPresetById: (presetId: string) => ExpertPreset | undefined
}

export const useExpertStore = create<ExpertStore>()(
  persist(
    (set, get) => ({
      experts: createDefaultExperts(),
      presets: [],
      currentPresetId: null,

      setExperts: (experts) => set({ experts, currentPresetId: null }),

      updateExpert: (id, updates) =>
        set((state) => ({
          experts: state.experts.map((expert) =>
            expert.id === id ? { ...expert, ...updates } : expert
          ),
          currentPresetId: null, // 修改后清除当前预设关联
        })),

      resetExperts: () => set({ experts: createDefaultExperts(), currentPresetId: null }),

      getExpertById: (id) => get().experts.find((expert) => expert.id === id),

      // 保存当前配置为预设
      saveCurrentAsPreset: (name, description) => {
        const { experts } = get()
        const preset = createExpertPreset(name, experts, description)
        set((state) => ({
          presets: [...state.presets, preset],
          currentPresetId: preset.id,
        }))
        return preset
      },

      // 加载预设
      loadPreset: (presetId) => {
        const preset = get().presets.find((p) => p.id === presetId)
        if (preset) {
          set({
            experts: JSON.parse(JSON.stringify(preset.experts)), // 深拷贝
            currentPresetId: presetId,
          })
        }
      },

      // 删除预设
      deletePreset: (presetId) =>
        set((state) => ({
          presets: state.presets.filter((p) => p.id !== presetId),
          currentPresetId: state.currentPresetId === presetId ? null : state.currentPresetId,
        })),

      // 更新预设信息
      updatePreset: (presetId, updates) =>
        set((state) => ({
          presets: state.presets.map((p) =>
            p.id === presetId ? { ...p, ...updates, updatedAt: Date.now() } : p
          ),
        })),

      // 获取预设
      getPresetById: (presetId) => get().presets.find((p) => p.id === presetId),
    }),
    {
      name: 'roundtable-experts',
    }
  )
)
