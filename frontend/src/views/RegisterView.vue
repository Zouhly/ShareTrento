<template>
  <div class="auth-container">
    <div class="auth-card">
      <div class="auth-header">
        <h2>Register</h2>
        <div class="auth-line"></div>
      </div>
      
      <div v-if="error" class="alert alert-error">
        {{ error }}
      </div>

      <form @submit.prevent="handleRegister">
        <div class="form-group">
          <label for="name">Full Name</label>
          <input
            type="text"
            id="name"
            v-model="form.name"
            required
            placeholder="John Doe"
          />
        </div>

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
            minlength="6"
            placeholder="Minimum 6 characters"
          />
        </div>

        <div class="form-group">
          <label>Select Role</label>
          <div class="role-options">
            <label class="role-option" :class="{ active: form.role === 'PASSENGER' }">
              <input type="radio" v-model="form.role" value="PASSENGER" />
              <span class="role-icon">[P]</span>
              <span class="role-label">Passenger</span>
              <span class="role-desc">Find rides</span>
            </label>
            <label class="role-option" :class="{ active: form.role === 'DRIVER' }">
              <input type="radio" v-model="form.role" value="DRIVER" />
              <span class="role-icon">[D]</span>
              <span class="role-label">Driver</span>
              <span class="role-desc">Offer rides</span>
            </label>
          </div>
        </div>

        <button type="submit" class="btn btn-primary btn-block" :disabled="loading">
          {{ loading ? 'Creating account...' : 'Create Account' }}
        </button>
      </form>

      <div class="auth-footer">
        <span>Already have an account?</span>
        <router-link to="/login">Login</router-link>
      </div>
    </div>
  </div>
</template>

<script>
import { authApi } from '../api'

export default {
  name: 'RegisterView',
  data() {
    return {
      form: {
        name: '',
        email: '',
        password: '',
        role: 'PASSENGER'
      },
      loading: false,
      error: null
    }
  },
  methods: {
    async handleRegister() {
      this.loading = true
      this.error = null

      try {
        const response = await authApi.register(this.form)
        const { token, user } = response.data.data

        localStorage.setItem('token', token)
        localStorage.setItem('user', JSON.stringify(user))
        window.dispatchEvent(new Event('storage'))

        if (user.role === 'DRIVER') {
          this.$router.push('/create-trip')
        } else {
          this.$router.push('/trips')
        }
      } catch (err) {
        this.error = err.response?.data?.message || 'Registration failed. Please try again.'
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
  max-width: 450px;
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

.role-options {
  display: flex;
  gap: var(--spacing-md);
}

.role-option {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--spacing-lg);
  border: var(--border);
  cursor: pointer;
  transition: all var(--transition-fast);
  text-align: center;
}

.role-option input[type="radio"] {
  display: none;
}

.role-option:hover {
  border-color: var(--color-text);
}

.role-option.active {
  background: var(--color-text);
  color: var(--color-bg);
}

.role-icon {
  font-family: var(--font-mono);
  font-size: var(--font-size-lg);
  font-weight: 600;
  margin-bottom: var(--spacing-sm);
}

.role-label {
  font-size: var(--font-size-sm);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.role-desc {
  font-size: var(--font-size-xs);
  opacity: 0.7;
  margin-top: var(--spacing-xs);
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
