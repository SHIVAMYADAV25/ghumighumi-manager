import api from './axios';

export const tripsApi = {
  getAll: (params) => api.get('/trips', { params }),
  getOne: (id) => api.get(`/trips/${id}`),
  create: (data) => api.post('/trips', data),
  update: (id, data) => api.put(`/trips/${id}`, data),
  delete: (id) => api.delete(`/trips/${id}`),
  archive: (id) => api.post(`/trips/${id}/archive`),
  duplicate: (id, data) => api.post(`/trips/${id}/duplicate`, data),
  getStats: (id) => api.get(`/trips/${id}/stats`),
  getActivityLog: (id, params) => api.get(`/trips/${id}/activity-log`, { params }),
  uploadCover: (id, file) => {
    const fd = new FormData(); fd.append('cover', file);
    return api.post(`/trips/${id}/cover`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
};

export const itineraryApi = {
  getAll: (tripId) => api.get(`/trips/${tripId}/itineraries`),
  update: (tripId, id, data) => api.patch(`/trips/${tripId}/itineraries/${id}`, data),
};

export const activitiesApi = {
  getAll: (tripId, params) => api.get(`/trips/${tripId}/activities`, { params }),
  create: (tripId, data) => api.post(`/trips/${tripId}/activities`, data),
  update: (tripId, id, data) => api.put(`/trips/${tripId}/activities/${id}`, data),
  delete: (tripId, id) => api.delete(`/trips/${tripId}/activities/${id}`),
  reorder: (tripId, activities) => api.patch(`/trips/${tripId}/activities/reorder`, { activities }),
  vote: (tripId, id, type) => api.post(`/trips/${tripId}/activities/${id}/vote`, { type }),
};

export const collaboratorsApi = {
  getAll: (tripId) => api.get(`/trips/${tripId}/collaborators`),
  invite: (tripId, data) => api.post(`/trips/${tripId}/collaborators/invite`, data),
  updateRole: (tripId, userId, role) => api.patch(`/trips/${tripId}/collaborators/${userId}/role`, { role }),
  remove: (tripId, userId) => api.delete(`/trips/${tripId}/collaborators/${userId}`),
  leave: (tripId) => api.post(`/trips/${tripId}/collaborators/leave`),
  getPendingInvites: (tripId) => api.get(`/trips/${tripId}/collaborators/invites`),
  revokeInvite: (tripId, inviteId) => api.delete(`/trips/${tripId}/collaborators/invites/${inviteId}`),
};

export const commentsApi = {
  getAll: (tripId, params) => api.get(`/trips/${tripId}/comments`, { params }),
  create: (tripId, data) => api.post(`/trips/${tripId}/comments`, data),
  update: (tripId, id, content) => api.patch(`/trips/${tripId}/comments/${id}`, { content }),
  delete: (tripId, id) => api.delete(`/trips/${tripId}/comments/${id}`),
  react: (tripId, id, emoji) => api.post(`/trips/${tripId}/comments/${id}/react`, { emoji }),
};

export const checklistsApi = {
  getAll: (tripId) => api.get(`/trips/${tripId}/checklists`),
  create: (tripId, data) => api.post(`/trips/${tripId}/checklists`, data),
  update: (tripId, id, data) => api.patch(`/trips/${tripId}/checklists/${id}`, data),
  delete: (tripId, id) => api.delete(`/trips/${tripId}/checklists/${id}`),
  addItem: (tripId, id, data) => api.post(`/trips/${tripId}/checklists/${id}/items`, data),
  toggleItem: (tripId, checklistId, itemId) => api.patch(`/trips/${tripId}/checklists/${checklistId}/items/${itemId}/toggle`),
  deleteItem: (tripId, checklistId, itemId) => api.delete(`/trips/${tripId}/checklists/${checklistId}/items/${itemId}`),
};

export const budgetApi = {
  getSummary: (tripId) => api.get(`/trips/${tripId}/budget`),
  update: (tripId, data) => api.patch(`/trips/${tripId}/budget`, data),
  addExpense: (tripId, data) => api.post(`/trips/${tripId}/budget/expenses`, data),
  updateExpense: (tripId, id, data) => api.patch(`/trips/${tripId}/budget/expenses/${id}`, data),
  deleteExpense: (tripId, id) => api.delete(`/trips/${tripId}/budget/expenses/${id}`),
  settleExpense: (tripId, id) => api.patch(`/trips/${tripId}/budget/expenses/${id}/settle`),
};

export const attachmentsApi = {
  getAll: (tripId, params) => api.get(`/trips/${tripId}/attachments`, { params }),
  upload: (tripId, formData) => api.post(`/trips/${tripId}/attachments`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (tripId, id) => api.delete(`/trips/${tripId}/attachments/${id}`),
};

export const reservationsApi = {
  getAll: (tripId, params) => api.get(`/trips/${tripId}/reservations`, { params }),
  create: (tripId, data) => api.post(`/trips/${tripId}/reservations`, data),
  update: (tripId, id, data) => api.patch(`/trips/${tripId}/reservations/${id}`, data),
  delete: (tripId, id) => api.delete(`/trips/${tripId}/reservations/${id}`),
};

export const inviteApi = {
  get: (token) => api.get(`/invites/${token}`),
  accept: (token) => api.post(`/invites/${token}/accept`),
  decline: (token) => api.post(`/invites/${token}/decline`),
};

export const notificationsApi = {
  getAll: (params) => api.get('/notifications', { params }),
  markRead: (ids) => api.patch('/notifications/read', { ids }),
  clearAll: () => api.delete('/notifications/clear'),
};

export const usersApi = {
  search: (q) => api.get('/users/search', { params: { q } }),
  getProfile: (id) => api.get(`/users/${id}`),
  getArchivedTrips: () => api.get('/users/archived-trips'),
};

export const weatherApi = {
  getForecast: (params) => api.get('/weather/forecast', { params }),
};