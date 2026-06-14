import api from '../config/api'

export const adminService = {
  getDashboard: () =>
    api.get('/admin/dashboard'),

  getUsers: (params = {}) =>
    api.get('/admin/users', { params }),

  getUser: (id) =>
    api.get(`/admin/users/${id}`),

  updateUser: (id, data) =>
    api.patch(`/admin/users/${id}`, data),

  deleteUser: (id) =>
    api.delete(`/admin/users/${id}`),

  getReports: (params = {}) =>
    api.get('/admin/reports', { params }),

  getSettings: () =>
    api.get('/admin/settings'),
}
