import api from './api';

export const orderApi = {
  createOrder: (orderData) => api.post('/orders', orderData),
  
  getMyOrders: () => api.get('/orders/my-orders'),
  
  getOrderById: (id) => api.get(`/orders/${id}`),
  
  cancelOrder: (id) => api.put(`/orders/${id}/cancel`),
  
  // Admin
  getAllOrders: (params) => api.get('/admin/orders', { params }),
  
  updateOrderStatus: (id, status) => api.put(`/admin/orders/${id}/status`, { status }),
};

export default orderApi;
