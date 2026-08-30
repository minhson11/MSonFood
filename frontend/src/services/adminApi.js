import api from './api';

// Dashboard Statistics
export const dashboardApi = {
  getStats: () => api.get('/admin/dashboard/stats'),
};

// User Management
export const userApi = {
  getAllUsers: (params) => api.get('/admin/users', { params }),
  getUserById: (id) => api.get(`/admin/users/${id}`),
  createUser: (data) => api.post('/admin/users', data),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
};

// Food Management (Admin)
export const adminFoodApi = {
  getAllFoods: (params) => api.get('/foods', { params }),
  createFood: (data) => api.post('/foods', data),
  updateFood: (id, data) => api.put(`/foods/${id}`, data),
  deleteFood: (id) => api.delete(`/foods/${id}`),
};

// Category Management (Admin)
export const adminCategoryApi = {
  getAllCategories: () => api.get('/categories'),
  createCategory: (data) => api.post('/categories', data),
  updateCategory: (id, data) => api.put(`/categories/${id}`, data),
  deleteCategory: (id) => api.delete(`/categories/${id}`),
};

// Order Management (Admin)
export const adminOrderApi = {
  getAllOrders: (params) => api.get('/admin/orders', { params }),
  updateOrderStatus: (id, status) => api.put(`/admin/orders/${id}/status`, { status }),
};

// Coupon Management (Admin)
export const adminCouponApi = {
  getAllCoupons: () => api.get('/admin/coupons'),
  getCouponById: (id) => api.get(`/coupons/${id}`),
  createCoupon: (data) => api.post('/coupons', data),
  updateCoupon: (id, data) => api.put(`/coupons/${id}`, data),
  deleteCoupon: (id) => api.delete(`/coupons/${id}`),
};

// Review Management (Admin)
export const adminReviewApi = {
  getAllReviews: (params) => api.get('/admin/reviews', { params }),
  deleteReview: (id) => api.delete(`/admin/reviews/${id}`),
};

// Topping Management (Admin)
export const adminToppingApi = {
  getAllToppings: () => api.get('/toppings'),
  createTopping: (data) => api.post('/admin/toppings', data),
  updateTopping: (id, data) => api.put(`/admin/toppings/${id}`, data),
  deleteTopping: (id) => api.delete(`/admin/toppings/${id}`),
  applyToFoods: (toppingIds, foodIds) => api.post('/admin/toppings/apply', { toppingIds, foodIds }),
  removeFromFoods: (toppingIds, foodIds) => api.post('/admin/toppings/remove', { toppingIds, foodIds }),
  updateFoodToppings: (foodId, toppingIds) => api.put(`/admin/toppings/food/${foodId}`, { toppingIds }),
  removeToppingFromFood: (foodId, toppingId) => api.delete(`/admin/toppings/food/${foodId}/${toppingId}`),
};


export default {
  dashboard: dashboardApi,
  users: userApi,
  foods: adminFoodApi,
  categories: adminCategoryApi,
  orders: adminOrderApi,
  coupons: adminCouponApi,
  reviews: adminReviewApi,
  toppings: adminToppingApi,
};
