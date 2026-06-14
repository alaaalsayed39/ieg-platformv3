import api from '../config/api'

export const paymentService = {
  getWallet: () =>
    api.get('/payments/wallet'),

  getTransactions: (params = {}) =>
    api.get('/payments/transactions', { params }),

  getStats: (params = {}) =>
    api.get('/payments/stats', { params }),

  deposit: (amount) =>
    api.post('/payments/deposit', { amount }),

  withdraw: (amount) =>
    api.post('/payments/withdraw', { amount }),

  payForOrder: (orderId) =>
    api.post(`/payments/pay/${orderId}`),
}
