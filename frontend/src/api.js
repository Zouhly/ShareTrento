import axios from 'axios'

// In production, VITE_API_URL points to the Render backend (e.g. https://sharetrento-api.onrender.com)
// In development, it falls back to '' so Vite's proxy handles /api requests
const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api'

// Create axios instance with base configuration
const api = axios.create({
  baseURL: API_BASE,
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

// Reviews API
export const reviewsApi = {
  create: (data) => api.post('/reviews', data),
  getDriverReviews: (driverId) => api.get(`/reviews/driver/${driverId}`),
  getMyReviews: () => api.get('/reviews/my-reviews')
}

// Favorites API
export const favoritesApi = {
  getAll: () => api.get('/favorites'),
  create: (data) => api.post('/favorites', data),
  delete: (id) => api.delete(`/favorites/${id}`)
}

export default api
