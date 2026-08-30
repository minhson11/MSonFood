import api from './api';

export const categoryApi = {
  getAllCategories: () => api.get('/categories'),
  
  getCategoryById: (id) => api.get(`/categories/${id}`),
  
  createCategory: (categoryData) => api.post('/categories', categoryData),
  
  updateCategory: (id, categoryData) => api.put(`/categories/${id}`, categoryData),
  
  deleteCategory: (id) => api.delete(`/categories/${id}`),
};

export default categoryApi;
