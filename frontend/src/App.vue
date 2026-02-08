<template>
  <div id="app">
    <nav class="navbar">
      <div class="nav-container">
        <router-link to="/" class="nav-brand">ShareTrento</router-link>
        
        <div class="nav-links">
          <router-link to="/trips">Browse</router-link>
          
          <template v-if="isLoggedIn">
            <router-link v-if="isDriver" to="/create-trip">Create</router-link>
            <router-link v-if="isDriver" to="/my-trips">My Trips</router-link>
            <router-link v-if="isPassenger" to="/my-bookings">Bookings</router-link>
            <router-link to="/favorites">Favorites</router-link>
            <router-link to="/profile">Profile</router-link>
            <span class="nav-divider"></span>
            <span class="user-badge">{{ user?.name }}</span>
            <button @click="logout" class="nav-btn">Logout</button>
          </template>
          
          <template v-else>
            <router-link to="/login">Login</router-link>
            <router-link to="/register" class="nav-btn-outline">Register</router-link>
          </template>
        </div>
      </div>
    </nav>

    <main class="main-content">
      <router-view />
    </main>

    <footer class="footer">
      <div class="footer-content">
        <span>ShareTrento</span>
        <span class="footer-divider">|</span>
        <span>Software Engineering Project</span>
      </div>
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

/* Navbar - Skeletal Style */
.navbar {
  border-bottom: var(--border);
  padding: var(--spacing-md) var(--spacing-xl);
  background: var(--color-bg-card);
}

.nav-container {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.nav-brand {
  font-size: var(--font-size-lg);
  font-weight: 600;
  letter-spacing: -0.02em;
  text-transform: uppercase;
  border-bottom: none !important;
}

.nav-links {
  display: flex;
  gap: var(--spacing-lg);
  align-items: center;
}

.nav-links a {
  font-size: var(--font-size-sm);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-secondary);
  padding: var(--spacing-xs) 0;
  border-bottom: var(--border-width) solid transparent;
  transition: all var(--transition-fast);
}

.nav-links a:hover,
.nav-links a.router-link-active {
  color: var(--color-text);
  border-bottom-color: var(--color-text);
}

.nav-divider {
  width: 1px;
  height: 20px;
  background: var(--color-border-light);
}

.user-badge {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.nav-btn {
  font-family: var(--font-family);
  font-size: var(--font-size-sm);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text);
  background: transparent;
  border: none;
  cursor: pointer;
  padding: var(--spacing-xs) 0;
  border-bottom: var(--border-width) solid transparent;
  transition: border-color var(--transition-fast);
}

.nav-btn:hover {
  border-bottom-color: var(--color-text);
}

.nav-btn-outline {
  padding: var(--spacing-xs) var(--spacing-md) !important;
  border: var(--border) !important;
  transition: all var(--transition-fast);
}

.nav-btn-outline:hover {
  background: var(--color-text);
  color: var(--color-bg) !important;
}

/* Main Content */
.main-content {
  flex: 1;
  padding: var(--spacing-lg) var(--spacing-xl);
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
  overflow: hidden;
}

/* Footer - Minimal */
.footer {
  border-top: var(--border);
  padding: var(--spacing-lg) var(--spacing-xl);
  background: var(--color-bg-card);
}

.footer-content {
  max-width: 1200px;
  margin: 0 auto;
  text-align: center;
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.footer-divider {
  margin: 0 var(--spacing-md);
  color: var(--color-border-light);
}

/* Responsive Styles */
@media (max-width: 768px) {
  .navbar {
    padding: var(--spacing-sm) var(--spacing-md);
  }
  
  .nav-links {
    gap: var(--spacing-sm);
    flex-wrap: wrap;
    justify-content: flex-end;
  }
  
  .nav-links a {
    font-size: var(--font-size-xs);
  }
  
  .nav-divider,
  .user-badge {
    display: none;
  }
  
  .main-content {
    padding: var(--spacing-md);
  }
  
  .footer {
    padding: var(--spacing-md);
  }
  
  .footer-content {
    font-size: var(--font-size-xs);
  }
}

@media (max-width: 480px) {
  .nav-brand {
    font-size: var(--font-size-base);
  }
  
  .nav-links {
    gap: var(--spacing-xs);
  }
  
  .nav-btn-outline {
    padding: var(--spacing-xs) var(--spacing-sm) !important;
  }
  
  .main-content {
    padding: var(--spacing-sm);
  }
}
</style>
