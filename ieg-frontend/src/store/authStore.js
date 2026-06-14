import { create } from 'zustand'

// Zustand without persist — access token stays in memory only (security best practice)
export const useAuthStore = create((set) => ({
  user:            null,
  accessToken:     null,
  isAuthenticated: false,
  isLoading:       true,

  setUser:  (user)  => set({ user, isAuthenticated: true }),
  setToken: (token) => set({ accessToken: token, isAuthenticated: !!token }),

  setAuth: (user, token) => set({ user, accessToken: token, isAuthenticated: true, isLoading: false }),

  logout: () => set({ user: null, accessToken: null, isAuthenticated: false, isLoading: false }),

  setLoading: (isLoading) => set({ isLoading }),
}))