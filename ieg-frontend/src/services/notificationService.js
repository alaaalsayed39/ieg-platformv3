import api from '../config/api'

export const notificationService = {
  getAll: (params = {}) =>
    api.get('/notifications', { params }),

  markRead: (id) =>
    api.patch(`/notifications/${id}/read`),

  markAllRead: () =>
    api.patch('/notifications/read-all'),
}
