import api from './axios';

export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  updateMe: (data) => api.patch('/auth/me', data),
  updatePassword: (data) => api.patch('/auth/me/password', data),
  uploadAvatar: (file) => {
    const fd = new FormData(); fd.append('avatar', file);
    return api.patch('/auth/me/avatar', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.patch(`/auth/reset-password/${token}`, { password }),
  verifyEmail: (token) => api.get(`/auth/verify-email/${token}`),
};