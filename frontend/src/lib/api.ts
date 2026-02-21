import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT access token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers['Authorization'] = `Bearer ${token}`
  return config
})

// Auto-refresh on 401
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      const refresh = localStorage.getItem('refresh_token')
      if (refresh) {
        try {
          const { data } = await axios.post('/api/auth/refresh', null, {
            params: { refresh_token: refresh },
          })
          localStorage.setItem('access_token', data.access_token)
          localStorage.setItem('refresh_token', data.refresh_token)
          original.headers['Authorization'] = `Bearer ${data.access_token}`
          return api(original)
        } catch {
          localStorage.clear()
          window.location.href = '/login'
        }
      } else {
        localStorage.clear()
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api

// Typed fetch helpers
export const authApi = {
  login: (username: string, password: string) =>
    api.post('/auth/login', { username, password }),
  me: () => api.get('/auth/me'),
  listUsers: () => api.get('/auth/users'),
  createUser: (data: { username: string; password: string; role: string; clearance_level: number }) =>
    api.post('/auth/users', data),
  deleteUser: (id: string) => api.delete(`/auth/users/${id}`),
}

export const personsApi = {
  list: () => api.get('/persons'),
  register: (formData: FormData) =>
    api.post('/persons', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (id: string) => api.delete(`/persons/${id}`),
  updatePriority: (id: string, priority: string) => {
    const fd = new FormData()
    fd.append('priority', priority)
    return api.patch(`/persons/${id}/priority`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
  },
}

export const detectionsApi = {
  list: (limit = 50) => api.get('/detections', { params: { limit } }),
  create: (formData: FormData) =>
    api.post('/detections', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  recent: () => api.get('/detections/recent'),
  updateStatus: (id: string, status: string) =>
    api.patch(`/detections/${id}/status`, null, { params: { status } }),
}

export const dashboardApi = {
  stats: () => api.get('/dashboard/stats'),
  health: () => api.get('/dashboard/health'),
}
