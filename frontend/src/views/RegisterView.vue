<template>
  <div class="auth-container">
    <div class="auth-card">
      <h2>Create Account</h2>
      
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
          <label>I want to:</label>
          <div class="role-options">
            <label class="role-option" :class="{ active: form.role === 'PASSENGER' }">
              <input type="radio" v-model="form.role" value="PASSENGER" />
              <span class="role-icon">🎫</span>
              <span>Find rides (Passenger)</span>
            </label>
            <label class="role-option" :class="{ active: form.role === 'DRIVER' }">
              <input type="radio" v-model="form.role" value="DRIVER" />
              <span class="role-icon">🚗</span>
              <span>Offer rides (Driver)</span>
            </label>
          </div>
        </div>

        <button type="submit" class="btn btn-primary" :disabled="loading">
          {{ loading ? 'Creating account...' : 'Create Account' }}
        </button>
      </form>

      <p class="auth-footer">
        Already have an account? 
        <router-link to="/login">Login here</router-link>
      </p>
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

        // Store token and user in localStorage
        localStorage.setItem('token', token)
        localStorage.setItem('user', JSON.stringify(user))

        // Trigger storage event for App.vue to update
        window.dispatchEvent(new Event('storage'))

        // Redirect based on role
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
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 450px;
}

.auth-card h2 {
  text-align: center;
  color: #2c3e50;
  margin-bottom: 1.5rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: #555;
  font-weight: 500;
}

.form-group input[type="text"],
.form-group input[type="email"],
.form-group input[type="password"] {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.form-group input:focus {
  outline: none;
  border-color: #667eea;
}

.role-options {
  display: flex;
  gap: 1rem;
  margin-top: 0.5rem;
}

.role-option {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem;
  border: 2px solid #ddd;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.role-option input[type="radio"] {
  display: none;
}

.role-option.active {
  border-color: #667eea;
  background: #f0f4ff;
}

.role-icon {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.btn {
  width: 100%;
  padding: 0.75rem;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  margin-top: 1rem;
}

.btn-primary {
  background: #667eea;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #5a6fd6;
}

.btn-primary:disabled {
  background: #a0aec0;
  cursor: not-allowed;
}

.alert {
  padding: 0.75rem;
  border-radius: 4px;
  margin-bottom: 1rem;
}

.alert-error {
  background: #fed7d7;
  color: #c53030;
  border: 1px solid #fc8181;
}

.auth-footer {
  text-align: center;
  margin-top: 1.5rem;
  color: #666;
}

.auth-footer a {
  color: #667eea;
}
</style>
