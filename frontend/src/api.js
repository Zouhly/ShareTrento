import axios from 'axios'

// Create axios instance with base configuration
const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear stored auth data on 401
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      // Redirect to login if not already there
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

// Auth API
export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/password', data)
}

// Trips API
export const tripsApi = {
  getAll: (params) => api.get('/trips', { params }),
  getById: (id) => api.get(`/trips/${id}`),
  search: (data) => api.post('/trips/search', data),
  create: (data) => api.post('/trips', data),
  delete: (id) => api.delete(`/trips/${id}`),
  getMyTrips: () => api.get('/trips/my-trips')
}

// Bookings API
export const bookingsApi = {
  join: (tripId) => api.post('/bookings', { tripId }),
  cancel: (id) => api.patch(`/bookings/${id}/cancel`),
  getMyBookings: () => api.get('/bookings/my-bookings'),
  getTripBookings: (tripId) => api.get(`/bookings/trip/${tripId}`)
}

export default api
