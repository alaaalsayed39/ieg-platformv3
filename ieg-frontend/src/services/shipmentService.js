import api from '../config/api'

export const shipmentService = {
  getStats: () => api.get('/shipments/stats'),

  getAvailableOrders: () => api.get('/shipments/available-orders'),

  getShipments: (params = {}) => api.get('/shipments', { params }),

  getById: (id) => api.get(`/shipments/${id}`),

  getByOrderId: (orderId) => api.get(`/shipments/by-order/${orderId}`),

  create: (data) => api.post('/shipments', data),

  updateStatus: (id, data) => api.patch(`/shipments/${id}/status`, data),

  updateLocation: (id, lat, lng, location) =>
    api.patch(`/shipments/${id}/location`, { lat, lng, location }),

  exportCsv: () => api.get('/shipments/export/report', { responseType: 'blob' }),

  exportPdf: () => api.get('/shipments/export/report/pdf', { responseType: 'blob' }),
}
