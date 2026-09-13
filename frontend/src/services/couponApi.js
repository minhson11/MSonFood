import api from './api';

export const couponApi = {
  // Public / Customer routes
  getActiveCoupons: () => api.get('/coupons'),
  applyCoupon: (code, orderValue) => api.post('/coupons/apply', { code, orderValue }),

  // Admin routes
  getAllCoupons: () => api.get('/admin/coupons'),
  getCouponById: (id) => api.get(`/coupons/${id}`),
  createCoupon: (data) => api.post('/coupons', data),
  updateCoupon: (id, data) => api.put(`/coupons/${id}`, data),
  deleteCoupon: (id) => api.delete(`/coupons/${id}`),
};

export default couponApi;
