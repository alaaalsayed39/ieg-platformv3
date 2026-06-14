import api from '../config/api'

export const authService = {
  login: (email, password) =>
    api.post('/auth/login', { email, password }),

  register: (payload) =>
    api.post('/auth/register', payload),

  refreshToken: () =>
    api.post('/auth/refresh-token'),

  logout: () =>
    api.post('/auth/logout'),

  getMe: () =>
    api.get('/auth/me'),

  forgotPassword: (email) =>
    api.post('/auth/forgot-password', { email }),

  resetPassword: (token, password) =>
    api.post(`/auth/reset-password/${token}`, { password }),
}
