import api from './api';

export const foodApi = {
  getAllFoods: (params) => api.get('/foods', { params }),
  
  getFoodById: (id) => api.get(`/foods/${id}`),
  
  createFood: (foodData) => api.post('/foods', foodData),
  
  updateFood: (id, foodData) => api.put(`/foods/${id}`, foodData),
  
  deleteFood: (id) => api.delete(`/foods/${id}`),
};

export default foodApi;
