<template>
  <div class="auth-container">
    <div class="auth-card">
      <div class="auth-header">
        <h2>Login</h2>
        <div class="auth-line"></div>
      </div>
      
      <div v-if="error" class="alert alert-error">
        {{ error }}
      </div>

      <form @submit.prevent="handleLogin">
        <div class="form-group">
          <label for="email">Email</label>
          <input
            type="email"
            id="email"
            v-model="form.email"
            required
            placeholder="your@email.com"
          />
        </div>

        <div class="form-group">
          <label for="password">Password</label>
          <input
            type="password"
            id="password"
            v-model="form.password"
            required
            placeholder="Enter password"
          />
        </div>

        <button type="submit" class="btn btn-primary btn-block" :disabled="loading">
          {{ loading ? 'Signing in...' : 'Sign In' }}
        </button>
      </form>

      <div class="auth-footer">
        <span>Don't have an account?</span>
        <router-link to="/register">Register</router-link>
      </div>
    </div>
  </div>
</template>

<script>
import { authApi } from '../api'

export default {
  name: 'LoginView',
  data() {
    return {
      form: {
        email: '',
        password: ''
      },
      loading: false,
      error: null
    }
  },
  methods: {
    async handleLogin() {
      this.loading = true
      this.error = null

      try {
        const response = await authApi.login(this.form)
        const { token, user } = response.data.data

        localStorage.setItem('token', token)
        localStorage.setItem('user', JSON.stringify(user))
        window.dispatchEvent(new Event('storage'))

        if (user.role === 'DRIVER') {
          this.$router.push('/my-trips')
        } else {
          this.$router.push('/trips')
        }
      } catch (err) {
        this.error = err.response?.data?.message || 'Login failed. Please try again.'
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<style scoped>
.auth-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 60vh;
}

.auth-card {
  border: var(--border);
  padding: var(--spacing-2xl);
  width: 100%;
  max-width: 400px;
  background: var(--color-bg-card);
}

.auth-header {
  text-align: center;
  margin-bottom: var(--spacing-xl);
}

.auth-header h2 {
  font-weight: 300;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  margin-bottom: var(--spacing-md);
}

.auth-line {
  width: 40px;
  height: 1px;
  background: var(--color-border);
  margin: 0 auto;
}

.auth-footer {
  text-align: center;
  margin-top: var(--spacing-xl);
  padding-top: var(--spacing-lg);
  border-top: var(--border-light);
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}

.auth-footer a {
  margin-left: var(--spacing-sm);
  font-weight: 500;
}
</style>
