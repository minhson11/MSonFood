import api from './api';

const reviewApi = {
  // Submit a new review (only allowed for completed orders)
  createReview: (data) => api.post('/reviews', data),

  // Get reviews for a food item (public)
  getFoodReviews: (foodId) => api.get(`/reviews/food/${foodId}`),

  // Get reviews this user has submitted for a specific order
  getOrderReviews: (orderId) => api.get(`/reviews/order/${orderId}`),

  // Update existing review
  updateReview: (reviewId, data) => api.put(`/reviews/${reviewId}`, data),

  // Delete a review
  deleteReview: (reviewId) => api.delete(`/reviews/${reviewId}`),
};

export default reviewApi;
