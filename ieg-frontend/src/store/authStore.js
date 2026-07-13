import { create } from 'zustand'

// Zustand without persist — access token stays in memory only (security best practice)
export const useAuthStore = create((set) => ({
  user:            null,
  accessToken:     null,
  isAuthenticated: false,
  isLoading:       true,

  // Added in M1.1 for API-contract stability ahead of M2 (auth integration)
  // and M6 (company/verification UI). Not yet populated by setAuth/login —
  // that wiring lands in M2 once the backend actually returns company data
  // on register/login. Until then this stays null and nothing reads it.
  /** @type {import('../types/company').Company | null} */
  company: null,

  setUser:    (user)    => set({ user, isAuthenticated: true }),
  setToken:   (token)   => set({ accessToken: token, isAuthenticated: !!token }),
  setCompany: (company) => set({ company }),

  setAuth: (user, token) => set({ user, accessToken: token, isAuthenticated: true, isLoading: false }),

  logout: () => set({ user: null, company: null, accessToken: null, isAuthenticated: false, isLoading: false }),

  setLoading: (isLoading) => set({ isLoading }),
}))