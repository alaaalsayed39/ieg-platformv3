import api from '../config/api'

export const orderService = {
  getOrders: (params = {}) =>
    api.get('/orders', { params }),

  getStats: () =>
    api.get('/orders/stats'),

  getById: (id) =>
    api.get(`/orders/${id}`),

  create: (data) =>
    api.post('/orders', data),

  updateStatus: (id, status, note = '') =>
    api.patch(`/orders/${id}/status`, { status, note }),

  // Buyer payment
  payForOrder: (orderId) =>
    api.post(`/payments/pay/${orderId}`),

  // Quotes
  getQuotes: (params = {}) =>
    api.get('/orders/quotes/list', { params }),

  sendQuote: (data) =>
    api.post('/orders/quotes', data),

  respondToQuote: (id, data) =>
    api.patch(`/orders/quotes/${id}/respond`, data),
}
