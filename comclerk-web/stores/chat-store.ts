// [COMCLERK-ADDED] 2025-12-02: 채팅 상태 관리 store
import { create } from 'zustand'

interface ChatState {
  isGenerating: boolean
  setIsGenerating: (value: boolean) => void
}

export const useChatStore = create<ChatState>((set) => ({
  isGenerating: false,
  setIsGenerating: (value) => set({ isGenerating: value }),
}))
