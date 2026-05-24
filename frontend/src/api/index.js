import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('access')
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

api.interceptors.response.use(r => r, async err => {
  if (err.response?.status === 401) {
    const refresh = localStorage.getItem('refresh')
    if (refresh) {
      try {
        const { data } = await axios.post('/api/auth/token/refresh/', { refresh })
        localStorage.setItem('access', data.access)
        err.config.headers.Authorization = `Bearer ${data.access}`
        return api(err.config)
      } catch {
        localStorage.clear()
        window.location.href = '/login'
      }
    } else {
      window.location.href = '/login'
    }
  }
  return Promise.reject(err)
})

export default api

export const auth = {
  login: d => api.post('/auth/token/', d),
  register: d => api.post('/auth/register/', d),
  verifyEmail: token => api.get('/auth/verify-email/', { params: { token } }),
  resendVerification: d => api.post('/auth/resend-verification/', d),
  me: () => api.get('/auth/me/'),
}
export const orders = {
  list: p => api.get('/orders/', { params: p }),
  get: id => api.get(`/orders/${id}/`),
  create: d => api.post('/orders/', d),
  update: (id, d) => api.patch(`/orders/${id}/`, d),
  delete: id => api.delete(`/orders/${id}/`),
  stats: () => api.get('/orders/stats/'),
  recent: () => api.get('/orders/recent/'),
  changelog: id => api.get(`/orders/${id}/changelog/`),
}
export const clients = {
  list: p => api.get('/clients/', { params: p }),
  get: id => api.get(`/clients/${id}/`),
  create: d => api.post('/clients/', d),
  update: (id, d) => api.patch(`/clients/${id}/`, d),
  delete: id => api.delete(`/clients/${id}/`),
  orders: id => api.get(`/clients/${id}/orders/`),
  leadSources: () => api.get('/clients/lead-sources/'),
  createLeadSource: d => api.post('/clients/lead-sources/', d),
  updateLeadSource: (id, d) => api.patch(`/clients/lead-sources/${id}/`, d),
  deleteLeadSource: id => api.delete(`/clients/lead-sources/${id}/`),
  contactTypes: () => api.get('/clients/contact-types/'),
  createContactType: d => api.post('/clients/contact-types/', d),
  updateContactType: (id, d) => api.patch(`/clients/contact-types/${id}/`, d),
  deleteContactType: id => api.delete(`/clients/contact-types/${id}/`),
}
export const services = {
  list: p => api.get('/services/', { params: p }),
  get: id => api.get(`/services/${id}/`),
  create: d => api.post('/services/', d),
  update: (id, d) => api.patch(`/services/${id}/`, d),
  delete: id => api.delete(`/services/${id}/`),
  orders: id => api.get(`/services/${id}/orders/`),
}
export const analytics = {
  byLeadSource: p => api.get('/analytics/income/by-lead-source/', { params: p }),
  byMonth: p => api.get('/analytics/income/by-month/', { params: p }),
  byService: () => api.get('/analytics/income/by-service/'),
  summary: p => api.get('/analytics/income/summary/', { params: p }),
  years: () => api.get('/analytics/years/'),
}
export const leads = {
  list: p => api.get('/leads/', { params: p }),
  get: id => api.get(`/leads/${id}/`),
  update: (id, d) => api.patch(`/leads/${id}/`, d),
  delete: id => api.delete(`/leads/${id}/`),
  accept: id => api.post(`/leads/${id}/accept/`),
  reject: (id, d) => api.post(`/leads/${id}/reject/`, d),
  createPublic: (userId, data) => axios.post('/api/leads/public/', { ...data, user_id: userId }),
}
export const formSettings = {
  get: () => api.get('/form-settings/'),
  update: d => api.patch('/form-settings/', d),
  getPublic: userId => axios.get('/api/form-settings/public/', { params: { user_id: userId } }),
}
