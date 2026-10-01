import api from './api';

export const authApi = {
  login: (credentials) => api.post('/auth/login', credentials),
  
  register: (userData) => api.post('/auth/register', userData),
  
  getCurrentUser: () => api.get('/auth/me'),
  
  updateProfile: (userData) => api.put('/auth/profile', userData),

  // Upload avatar — send base64 string, saved to DB via updateProfile route
  uploadAvatar: (base64Image) => api.put('/auth/profile', { avatar: base64Image }),
  
  changePassword: (passwordData) => api.put('/auth/change-password', passwordData),
  
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  
  resetPassword: (token, newPassword) => api.post('/auth/reset-password', { token, newPassword }),
};

export default authApi;
