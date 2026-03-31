import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Role, AuthUser } from '@/types/auth'

interface AuthState {
  user: AuthUser | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  setAuth: (data: {
    user: AuthUser
    accessToken: string
    refreshToken: string
  }) => void
  setAccessToken: (token: string) => void
  setRefreshToken: (token: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      setAuth: ({ user, accessToken, refreshToken }) =>
        set({ user, accessToken, refreshToken, isAuthenticated: true }),

      setAccessToken: (token) => set({ accessToken: token }),

      setRefreshToken: (token) => set({ refreshToken: token }),

      logout: () =>
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false }),
    }),
    {
      name: 'crm-auth',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)

// Selectors
export const selectUser = (state: AuthState) => state.user
export const selectRole = (state: AuthState): Role | null => state.user?.role ?? null
export const selectIsAuthenticated = (state: AuthState) => state.isAuthenticated
