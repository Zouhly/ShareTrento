<template>
  <div id="app">
    <nav class="navbar">
      <div class="nav-brand">
        <router-link to="/">🚗 ShareTrento</router-link>
      </div>
      <div class="nav-links">
        <router-link to="/trips">Browse Trips</router-link>
        
        <template v-if="isLoggedIn">
          <router-link v-if="isDriver" to="/create-trip">Create Trip</router-link>
          <router-link v-if="isDriver" to="/my-trips">My Trips</router-link>
          <router-link v-if="isPassenger" to="/my-bookings">My Bookings</router-link>
          <span class="user-info">{{ user?.name }} ({{ user?.role }})</span>
          <button @click="logout" class="btn-logout">Logout</button>
        </template>
        
        <template v-else>
          <router-link to="/login">Login</router-link>
          <router-link to="/register">Register</router-link>
        </template>
      </div>
    </nav>

    <main class="main-content">
      <router-view />
    </main>

    <footer class="footer">
      <p>ShareTrento - University Software Engineering Project</p>
    </footer>
  </div>
</template>

<script>
export default {
  name: 'App',
  data() {
    return {
      user: null
    }
  },
  computed: {
    isLoggedIn() {
      return !!this.user
    },
    isDriver() {
      return this.user?.role === 'DRIVER'
    },
    isPassenger() {
      return this.user?.role === 'PASSENGER'
    }
  },
  created() {
    this.loadUser()
    // Listen for storage changes (login/logout in other tabs)
    window.addEventListener('storage', this.loadUser)
  },
  methods: {
    loadUser() {
      const userData = localStorage.getItem('user')
      this.user = userData ? JSON.parse(userData) : null
    },
    logout() {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      this.user = null
      this.$router.push('/login')
    }
  }
}
</script>

<style>
#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.navbar {
  background: #2c3e50;
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.nav-brand a {
  color: white;
  text-decoration: none;
  font-size: 1.5rem;
  font-weight: bold;
}

.nav-links {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.nav-links a {
  color: #ecf0f1;
  text-decoration: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  transition: background 0.3s;
}

.nav-links a:hover,
.nav-links a.router-link-active {
  background: #34495e;
}

.user-info {
  color: #bdc3c7;
  font-size: 0.9rem;
}

.btn-logout {
  background: #e74c3c;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
}

.btn-logout:hover {
  background: #c0392b;
}

.main-content {
  flex: 1;
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

.footer {
  background: #2c3e50;
  color: #ecf0f1;
  text-align: center;
  padding: 1rem;
  margin-top: auto;
}
</style>
