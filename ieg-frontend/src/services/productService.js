import api from '../config/api'

export const productService = {
  // Public marketplace
  getMarketplace: (params = {}) =>
    api.get('/products', { params }),

  getById: (id) =>
    api.get(`/products/${id}`),

  // Exporter: own products
  getMyProducts: (params = {}) =>
    api.get('/products/my/products', { params }),

  create: (data) =>
    api.post('/products', data),

  update: (id, data) =>
    api.put(`/products/${id}`, data),

  updateStatus: (id, status) =>
    api.patch(`/products/${id}/status`, { status }),

  remove: (id) =>
    api.delete(`/products/${id}`),
}
