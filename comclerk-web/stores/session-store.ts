import { create } from 'zustand'
import { Session } from '@/types'

interface SessionState {
  currentSession: Session | null
  sessions: Session[]
  isLoading: boolean
  error: string | null
  setCurrentSession: (session: Session | null) => void
  setSessions: (sessions: Session[]) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

export const useSessionStore = create<SessionState>((set) => ({
  currentSession: null,
  sessions: [],
  isLoading: false,
  error: null,
  setCurrentSession: (session) => set({ currentSession: session }),
  setSessions: (sessions) => set({ sessions }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}))
