// [COMCLERK-ADDED] 2025-12-01: Agent state management store
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AgentFull } from '@/types'

interface AgentState {
  selectedAgent: string | null
  agents: AgentFull[]
  setSelectedAgent: (name: string | null) => void
  setAgents: (agents: AgentFull[]) => void
  cycleAgent: (direction: 'next' | 'prev') => void
  selectAgentByIndex: (index: number) => void
  getPrimaryAgents: () => AgentFull[]
  getSelectedAgentInfo: () => AgentFull | null
}

export const useAgentStore = create<AgentState>()(
  persist(
    (set, get) => ({
      selectedAgent: null,
      agents: [],

      setSelectedAgent: (name) => set({ selectedAgent: name }),

      setAgents: (agents) => set({ agents }),

      cycleAgent: (direction) => {
        const { agents, selectedAgent } = get()
        const primaryAgents = agents.filter((a) => a.mode === 'primary' || a.mode === 'all')

        if (primaryAgents.length === 0) return

        const currentIndex = primaryAgents.findIndex((a) => a.name === selectedAgent)
        let nextIndex: number

        if (currentIndex === -1) {
          nextIndex = 0
        } else if (direction === 'next') {
          nextIndex = (currentIndex + 1) % primaryAgents.length
        } else {
          nextIndex = (currentIndex - 1 + primaryAgents.length) % primaryAgents.length
        }

        set({ selectedAgent: primaryAgents[nextIndex].name })
      },

      selectAgentByIndex: (index) => {
        const { agents } = get()
        const primaryAgents = agents.filter((a) => a.mode === 'primary' || a.mode === 'all')

        if (index >= 0 && index < primaryAgents.length) {
          set({ selectedAgent: primaryAgents[index].name })
        }
      },

      getPrimaryAgents: () => {
        const { agents } = get()
        return agents.filter((a) => a.mode === 'primary' || a.mode === 'all')
      },

      getSelectedAgentInfo: () => {
        const { agents, selectedAgent } = get()
        return agents.find((a) => a.name === selectedAgent) || null
      },
    }),
    {
      name: 'agent-storage',
      partialize: (state) => ({ selectedAgent: state.selectedAgent }),
    }
  )
)
