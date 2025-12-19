import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Message, RoundtableState, DEFAULT_ROUNDTABLE_STATE, createUserMessage, createExpertMessage, ChatHistory, createChatHistory } from '../types'

interface SessionStore {
  messages: Message[]
  roundtableState: RoundtableState
  chatHistories: ChatHistory[]
  currentChatId: string | null
  // Actions
  addMessage: (message: Message) => void
  addUserMessage: (content: string) => void
  addExpertMessage: (expertId: string, content: string) => void
  updateMessage: (id: string, updates: Partial<Message>) => void
  clearMessages: () => void
  // Roundtable state actions
  startDiscussion: () => void
  stopDiscussion: () => void
  nextExpert: () => void
  nextRound: () => void
  setConsensusReached: (reached: boolean) => void
  resetRoundtable: () => void
  setCurrentExpertIndex: (index: number) => void
  // Chat history actions
  saveCurrentChat: (title: string, expertPresetId?: string) => ChatHistory
  loadChat: (chatId: string) => void
  deleteChat: (chatId: string) => void
  updateChatTitle: (chatId: string, title: string) => void
  getChatById: (chatId: string) => ChatHistory | undefined
}

export const useSessionStore = create<SessionStore>()(
  persist(
    (set, get) => ({
  messages: [],
  roundtableState: DEFAULT_ROUNDTABLE_STATE,
  chatHistories: [],
  currentChatId: null,

  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
    })),

  addUserMessage: (content) => {
    const { roundtableState, addMessage } = get()
    const message = createUserMessage(content, roundtableState.currentRound)
    addMessage(message)
  },

  addExpertMessage: (expertId, content) => {
    const { roundtableState, addMessage } = get()
    const message = createExpertMessage(expertId, content, roundtableState.currentRound)
    addMessage(message)
  },

  updateMessage: (id, updates) =>
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === id ? { ...msg, ...updates } : msg
      ),
    })),

  clearMessages: () => set({ messages: [] }),

  startDiscussion: () =>
    set((state) => ({
      roundtableState: {
        ...state.roundtableState,
        isDiscussing: true,
        currentRound: 1,
        currentExpertIndex: 0,
        consensusReached: false,
      },
    })),

  stopDiscussion: () =>
    set((state) => ({
      roundtableState: {
        ...state.roundtableState,
        isDiscussing: false,
      },
    })),

  nextExpert: () =>
    set((state) => ({
      roundtableState: {
        ...state.roundtableState,
        currentExpertIndex: state.roundtableState.currentExpertIndex + 1,
      },
    })),

  nextRound: () =>
    set((state) => ({
      roundtableState: {
        ...state.roundtableState,
        currentRound: state.roundtableState.currentRound + 1,
        currentExpertIndex: 0,
      },
    })),

  setConsensusReached: (reached) =>
    set((state) => ({
      roundtableState: {
        ...state.roundtableState,
        consensusReached: reached,
        isDiscussing: reached ? false : state.roundtableState.isDiscussing,
      },
    })),

  resetRoundtable: () =>
    set({
      messages: [],
      roundtableState: DEFAULT_ROUNDTABLE_STATE,
    }),

  setCurrentExpertIndex: (index) =>
    set((state) => ({
      roundtableState: {
        ...state.roundtableState,
        currentExpertIndex: index,
      },
    })),

  // 保存当前聊天记录
  saveCurrentChat: (title, expertPresetId) => {
    const { messages } = get()
    if (messages.length === 0) {
      throw new Error('没有可保存的聊天记录')
    }
    const chat = createChatHistory(title, messages, expertPresetId)
    set((state) => ({
      chatHistories: [...state.chatHistories, chat],
      currentChatId: chat.id,
    }))
    return chat
  },

  // 加载聊天记录
  loadChat: (chatId) => {
    const chat = get().chatHistories.find((c) => c.id === chatId)
    if (chat) {
      set({
        messages: JSON.parse(JSON.stringify(chat.messages)), // 深拷贝
        currentChatId: chatId,
        roundtableState: DEFAULT_ROUNDTABLE_STATE,
      })
    }
  },

  // 删除聊天记录
  deleteChat: (chatId) =>
    set((state) => ({
      chatHistories: state.chatHistories.filter((c) => c.id !== chatId),
      currentChatId: state.currentChatId === chatId ? null : state.currentChatId,
    })),

  // 更新聊天标题
  updateChatTitle: (chatId, title) =>
    set((state) => ({
      chatHistories: state.chatHistories.map((c) =>
        c.id === chatId ? { ...c, title, updatedAt: Date.now() } : c
      ),
    })),

  // 获取聊天记录
  getChatById: (chatId) => get().chatHistories.find((c) => c.id === chatId),
    }),
    {
      name: 'roundtable-session',
      partialize: (state) => ({
        messages: state.messages,
        chatHistories: state.chatHistories,
        currentChatId: state.currentChatId,
      }),
    }
  )
)
