import api from '../config/api'

export const verificationService = {
  getMyStatus: () =>
    api.get('/verifications/my'),

  submit: (data) =>
    api.post('/verifications/submit', data),

  getAll: (params = {}) =>
    api.get('/verifications', { params }),

  review: (id, status, notes = '') =>
    api.patch(`/verifications/${id}/review`, { status, reviewerNotes: notes }),
}
