import api from '../config/api'

export const documentService = {
  getMyDocs: (params = {}) =>
    api.get('/documents/my', { params }),

  getStats: () =>
    api.get('/documents/stats'),

  upload: (formData) =>
    api.post('/documents/upload', formData),

  remove: (id) =>
    api.delete(`/documents/${id}`),

  // Admin
  getAdminAll: (params = {}) =>
    api.get('/documents/admin/all', { params }),

  getPending: (params = {}) =>
    api.get('/documents/pending', { params }),

  approve: (id, approvalNotes = '') =>
    api.patch(`/documents/${id}/approve`, { approvalNotes }),

  reject: (id, rejectionReason) =>
    api.patch(`/documents/${id}/reject`, { rejectionReason }),

  /** @deprecated use approve/reject */
  review: (id, status, notes = '') =>
    api.patch(`/documents/${id}/review`, { status, reviewerNotes: notes }),
}
