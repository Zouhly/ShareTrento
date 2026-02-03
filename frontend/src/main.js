import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'

// Import global styles
import './assets/styles.css'

// Import views
import HomeView from './views/HomeView.vue'
import LoginView from './views/LoginView.vue'
import RegisterView from './views/RegisterView.vue'
import TripsView from './views/TripsView.vue'
import MyTripsView from './views/MyTripsView.vue'
import MyBookingsView from './views/MyBookingsView.vue'
import CreateTripView from './views/CreateTripView.vue'

// Router configuration
const routes = [
  { path: '/', name: 'home', component: HomeView },
  { path: '/login', name: 'login', component: LoginView },
  { path: '/register', name: 'register', component: RegisterView },
  { path: '/trips', name: 'trips', component: TripsView },
  { path: '/my-trips', name: 'my-trips', component: MyTripsView, meta: { requiresAuth: true, role: 'DRIVER' } },
  { path: '/my-bookings', name: 'my-bookings', component: MyBookingsView, meta: { requiresAuth: true } },
  { path: '/create-trip', name: 'create-trip', component: CreateTripView, meta: { requiresAuth: true, role: 'DRIVER' } }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Navigation guard
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  const user = JSON.parse(localStorage.getItem('user') || 'null')

  if (to.meta.requiresAuth && !token) {
    next('/login')
  } else if (to.meta.role && user?.role !== to.meta.role) {
    next('/')
  } else {
    next()
  }
})

const app = createApp(App)
app.use(router)
app.mount('#app')
