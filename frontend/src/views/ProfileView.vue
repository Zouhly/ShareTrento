<template>
  <div class="profile-view">
    <div class="page-header">
      <h1>Profile</h1>
      <div class="header-line"></div>
    </div>

    <div class="profile-grid">
      <!-- Profile Info Card -->
      <div class="profile-card">
        <div class="card-header">
          <span class="card-title">Account Information</span>
          <span class="badge" :class="user?.role === 'DRIVER' ? 'badge-success' : 'badge-muted'">
            {{ user?.role }}
          </span>
        </div>

        <div v-if="profileError" class="alert alert-error">{{ profileError }}</div>
        <div v-if="profileSuccess" class="alert alert-success">{{ profileSuccess }}</div>

        <form @submit.prevent="handleUpdateProfile">
          <div class="form-group">
            <label for="name">Name</label>
            <input
              type="text"
              id="name"
              v-model="profileForm.name"
              required
              placeholder="Your name"
            />
          </div>

          <div class="form-group">
            <label for="email">Email</label>
            <input
              type="email"
              id="email"
              v-model="profileForm.email"
              required
              placeholder="your@email.com"
            />
          </div>

          <div class="form-group">
            <label>Member Since</label>
            <div class="static-value">{{ formatDate(user?.createdAt) }}</div>
          </div>

          <button type="submit" class="btn btn-primary btn-block" :disabled="profileLoading">
            {{ profileLoading ? 'Saving...' : 'Save Changes' }}
          </button>
        </form>
      </div>

      <!-- Change Password Card -->
      <div class="profile-card">
        <div class="card-header">
          <span class="card-title">Change Password</span>
        </div>

        <div v-if="passwordError" class="alert alert-error">{{ passwordError }}</div>
        <div v-if="passwordSuccess" class="alert alert-success">{{ passwordSuccess }}</div>

        <form @submit.prevent="handleChangePassword">
          <div class="form-group">
            <label for="currentPassword">Current Password</label>
            <input
              type="password"
              id="currentPassword"
              v-model="passwordForm.currentPassword"
              required
              placeholder="Enter current password"
            />
          </div>

          <div class="form-group">
            <label for="newPassword">New Password</label>
            <input
              type="password"
              id="newPassword"
              v-model="passwordForm.newPassword"
              required
              minlength="6"
              placeholder="Minimum 6 characters"
            />
          </div>

          <div class="form-group">
            <label for="confirmPassword">Confirm New Password</label>
            <input
              type="password"
              id="confirmPassword"
              v-model="passwordForm.confirmPassword"
              required
              placeholder="Confirm new password"
            />
          </div>

          <button type="submit" class="btn btn-block" :disabled="passwordLoading">
            {{ passwordLoading ? 'Changing...' : 'Change Password' }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import { authApi } from '../api'

export default {
  name: 'ProfileView',
  data() {
    return {
      user: null,
      profileForm: {
        name: '',
        email: ''
      },
      passwordForm: {
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      },
      profileLoading: false,
      passwordLoading: false,
      profileError: null,
      profileSuccess: null,
      passwordError: null,
      passwordSuccess: null
    }
  },
  async created() {
    await this.loadProfile()
  },
  methods: {
    async loadProfile() {
      try {
        const response = await authApi.getMe()
        this.user = response.data.data.user
        this.profileForm.name = this.user.name
        this.profileForm.email = this.user.email
      } catch (err) {
        this.profileError = 'Failed to load profile'
      }
    },
    async handleUpdateProfile() {
      this.profileLoading = true
      this.profileError = null
      this.profileSuccess = null

      try {
        const response = await authApi.updateProfile(this.profileForm)
        this.user = response.data.data.user
        
        // Update localStorage
        localStorage.setItem('user', JSON.stringify(this.user))
        window.dispatchEvent(new Event('storage'))
        
        this.profileSuccess = 'Profile updated successfully'
      } catch (err) {
        this.profileError = err.response?.data?.message || 'Failed to update profile'
      } finally {
        this.profileLoading = false
      }
    },
    async handleChangePassword() {
      this.passwordLoading = true
      this.passwordError = null
      this.passwordSuccess = null

      // Validate passwords match
      if (this.passwordForm.newPassword !== this.passwordForm.confirmPassword) {
        this.passwordError = 'New passwords do not match'
        this.passwordLoading = false
        return
      }

      try {
        await authApi.changePassword({
          currentPassword: this.passwordForm.currentPassword,
          newPassword: this.passwordForm.newPassword
        })
        
        this.passwordSuccess = 'Password changed successfully'
        
        // Clear form
        this.passwordForm = {
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        }
      } catch (err) {
        this.passwordError = err.response?.data?.message || 'Failed to change password'
      } finally {
        this.passwordLoading = false
      }
    },
    formatDate(dateString) {
      if (!dateString) return 'N/A'
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    }
  }
}
</script>

<style scoped>
.page-header {
  margin-bottom: var(--spacing-xl);
}

.page-header h1 {
  font-weight: 300;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: var(--spacing-md);
}

.header-line {
  width: 60px;
  height: 1px;
  background: var(--color-border);
}

.profile-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: var(--spacing-xl);
}

.profile-card {
  border: var(--border);
  background: var(--color-bg-card);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-lg);
  border-bottom: var(--border-light);
}

.card-title {
  font-size: var(--font-size-sm);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.profile-card form {
  padding: var(--spacing-lg);
}

.static-value {
  padding: var(--spacing-md);
  border: var(--border-light);
  background: var(--color-bg);
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}
</style>
