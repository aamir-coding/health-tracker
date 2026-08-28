import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ht_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (r) => r,
  (error) => {
    if (error.response?.status === 401) {
      // Never redirect on auth routes — the page handles the error itself
      const url = error.config?.url || ''
      const isAuthRoute = url.includes('/auth/login') ||
                          url.includes('/auth/register') ||
                          url.includes('/auth/password')
      if (!isAuthRoute) {
        localStorage.removeItem('ht_token')
        localStorage.removeItem('ht_user')
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export const authApi = {
  register:          (data) => api.post('/auth/register', data),
  login:             (data) => api.post('/auth/login', data),
  getMe:             ()     => api.get('/auth/me'),
  updateProfile:     (data) => api.patch('/auth/profile', data),
  updatePreferences: (data) => api.patch('/auth/preferences', data),
  updateGoals:       (data) => api.patch('/auth/goals', data),
  changePassword:    (data) => api.patch('/auth/password', data),
  deleteAccount:     (data) => api.delete('/auth/account', { data }),
}

export const logsApi = {
  getAll:    (params) => api.get('/logs', { params }),
  getRecent: ()       => api.get('/logs/recent'),
  getStats:  ()       => api.get('/logs/stats'),
  getDay:    (dateLocal) => api.get(`/logs/day/${dateLocal}`),
  getStreak: ()       => api.get('/logs/streak'),
  getHeatmap:()       => api.get('/logs/heatmap'),
    increment: (field, amount, dateLocal) => api.post(`/logs/today/${field}`, { amount, dateLocal }),
    getCompare:()       => api.get('/logs/compare'),
  create:    (data)   => api.post('/logs', data),
  update:    (id, d)  => api.put(`/logs/${id}`, d),
  delete:    (id)     => api.delete(`/logs/${id}`),
}

export const insightsApi = {
  getWeekly: (refresh = false) =>
    api.get('/insights/weekly', { params: refresh ? { refresh: 1 } : {} }),
}

export default api