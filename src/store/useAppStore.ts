import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Language, SbmUser } from '@/lib/types'

interface AppState {
  language: Language
  user: SbmUser | null
  setLanguage: (lang: Language) => void
  setUser: (user: SbmUser | null) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      language: 'zh',
      user: null,
      setLanguage: (lang) => set({ language: lang }),
      setUser: (user) => set({ user }),
    }),
    {
      name: 'sbm-app-store',
      partialize: (state) => ({ language: state.language }),
    }
  )
)
