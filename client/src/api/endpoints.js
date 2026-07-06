import { api } from './client';

export const authApi = {
  me: () => api.get('/auth/me').then((res) => res.data.user),
  login: (payload) => api.post('/auth/login', payload).then((res) => res.data.user),
  register: (payload) => api.post('/auth/register', payload).then((res) => res.data.user),
  logout: () => api.post('/auth/logout')
};

export const projectApi = {
  all: () => api.get('/projects').then((res) => res.data.projects),
  create: (payload) => api.post('/projects', payload).then((res) => res.data),
  get: (id) => api.get(`/projects/${id}`).then((res) => res.data),
  update: (id, payload) => api.put(`/projects/${id}`, payload).then((res) => res.data),
  invite: (id, payload) => api.post(`/projects/${id}/invite`, payload).then((res) => res.data),
  removeMember: (id, userId) => api.delete(`/projects/${id}/members/${userId}`).then((res) => res.data),
  createList: (id, payload) => api.post(`/projects/${id}/lists`, payload).then((res) => res.data.list)
};

export const taskApi = {
  create: (listId, payload) => api.post(`/lists/${listId}/tasks`, payload).then((res) => res.data.task),
  update: (taskId, payload) => api.put(`/tasks/${taskId}`, payload).then((res) => res.data.task),
  remove: (taskId) => api.delete(`/tasks/${taskId}`),
  comments: (taskId) => api.get(`/tasks/${taskId}/comments`).then((res) => res.data.comments),
  addComment: (taskId, payload) => api.post(`/tasks/${taskId}/comments`, payload).then((res) => res.data.comment)
};

export const notificationApi = {
  all: () => api.get('/notifications').then((res) => res.data.notifications),
  read: (id) => api.put(`/notifications/${id}/read`).then((res) => res.data.notification),
  readAll: () => api.put('/notifications/read-all')
};
