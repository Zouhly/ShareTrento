<template>
  <div class="favorites-view">
    <div class="page-header">
      <h1>Favorite Searches</h1>
      <div class="header-line"></div>
      <p class="page-subtitle">Save recurring trip searches so you can find rides quickly.</p>
    </div>

    <!-- Add New Favorite -->
    <div class="form-card">
      <div class="form-card-header">
        <span class="form-label">New Favorite</span>
      </div>
      <form @submit.prevent="addFavorite" class="favorite-form">
        <div class="form-row">
          <div class="form-group">
            <label for="label">Label</label>
            <input
              type="text"
              id="label"
              v-model="form.label"
              placeholder="e.g., Daily commute"
              required
            />
          </div>
          <div class="form-group">
            <label for="origin">Origin</label>
            <input
              type="text"
              id="origin"
              v-model="form.origin"
              placeholder="e.g., Trento Centro"
              required
            />
          </div>
          <div class="form-group">
            <label for="destination">Destination</label>
            <input
              type="text"
              id="destination"
              v-model="form.destination"
              placeholder="e.g., Rovereto"
              required
            />
          </div>
          <div class="form-group">
            <label for="preferredTime">Preferred Time</label>
            <input
              type="time"
              id="preferredTime"
              v-model="form.preferredTime"
            />
          </div>
        </div>
        <div class="form-actions">
          <button type="submit" class="btn btn-primary" :disabled="saving">
            {{ saving ? 'Saving...' : 'Save Favorite' }}
          </button>
        </div>
      </form>
    </div>

    <!-- Alerts -->
    <div v-if="error" class="alert alert-error">{{ error }}</div>
    <div v-if="successMessage" class="alert alert-success">{{ successMessage }}</div>

    <!-- Loading -->
    <div v-if="loading" class="loading">Loading...</div>

    <!-- Favorites List -->
    <div v-if="!loading && favorites.length === 0" class="empty-state">
      <p>No saved favorites yet. Add one above to get started!</p>
    </div>

    <div v-if="!loading" class="favorites-list">
      <div
        v-for="fav in favorites"
        :key="fav._id"
        class="favorite-card"
      >
        <div class="fav-header">
          <span class="fav-label">{{ fav.label }}</span>
          <span v-if="fav.preferredTime" class="fav-time">{{ fav.preferredTime }}</span>
        </div>
        <div class="fav-body">
          <div class="fav-route">
            <span class="route-text">{{ fav.origin }}</span>
            <span class="route-arrow">&rarr;</span>
            <span class="route-text">{{ fav.destination }}</span>
          </div>
        </div>
        <div class="fav-footer">
          <button class="btn btn-primary btn-sm" @click="useFavorite(fav)">Search Now</button>
          <button class="btn btn-danger btn-sm" @click="removeFavorite(fav._id)">Delete</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { favoritesApi } from '../api'

export default {
  name: 'FavoritesView',
  data() {
    return {
      favorites: [],
      loading: false,
      saving: false,
      error: null,
      successMessage: null,
      form: {
        label: '',
        origin: '',
        destination: '',
        preferredTime: ''
      }
    }
  },
  async created() {
    await this.loadFavorites()
  },
  methods: {
    async loadFavorites() {
      this.loading = true
      this.error = null
      try {
        const res = await favoritesApi.getAll()
        this.favorites = res.data.data.favorites
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to load favorites'
      } finally {
        this.loading = false
      }
    },
    async addFavorite() {
      this.saving = true
      this.error = null
      this.successMessage = null
      try {
        const payload = {
          label: this.form.label,
          origin: this.form.origin,
          destination: this.form.destination
        }
        if (this.form.preferredTime) {
          payload.preferredTime = this.form.preferredTime
        }
        await favoritesApi.create(payload)
        this.successMessage = 'Favorite saved!'
        this.form = { label: '', origin: '', destination: '', preferredTime: '' }
        await this.loadFavorites()
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to save favorite'
      } finally {
        this.saving = false
      }
    },
    async removeFavorite(id) {
      this.error = null
      this.successMessage = null
      try {
        await favoritesApi.delete(id)
        this.successMessage = 'Favorite deleted'
        await this.loadFavorites()
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to delete favorite'
      }
    },
    useFavorite(fav) {
      // Build a departure datetime from today + preferred time (or leave empty)
      let departureTime = ''
      if (fav.preferredTime) {
        const now = new Date()
        const [hours, minutes] = fav.preferredTime.split(':').map(Number)
        const target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes)
        // If the time has already passed today, use tomorrow
        if (target <= now) {
          target.setDate(target.getDate() + 1)
        }
        // Format as datetime-local value: YYYY-MM-DDTHH:mm
        const pad = (n) => String(n).padStart(2, '0')
        departureTime = `${target.getFullYear()}-${pad(target.getMonth() + 1)}-${pad(target.getDate())}T${pad(hours)}:${pad(minutes)}`
      }

      // Navigate to trips page with query params so TripsView can pick them up
      this.$router.push({
        path: '/trips',
        query: {
          origin: fav.origin,
          destination: fav.destination,
          ...(departureTime ? { departureTime } : {})
        }
      })
    }
  }
}
</script>

<style scoped>
.favorites-view {
  max-width: 900px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: var(--spacing-lg);
}

.page-header h1 {
  font-weight: 300;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: var(--spacing-sm);
}

.header-line {
  width: 60px;
  height: 1px;
  background: var(--color-border);
  margin-bottom: var(--spacing-sm);
}

.page-subtitle {
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
  margin: 0;
}

/* Form Card */
.form-card {
  border: var(--border);
  padding: var(--spacing-md) var(--spacing-lg);
  margin-bottom: var(--spacing-lg);
  background: var(--color-bg-card);
}

.form-card-header {
  margin-bottom: var(--spacing-sm);
}

.form-label {
  font-size: var(--font-size-xs);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--color-text-muted);
}

.form-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-sm);
}

.form-row .form-group {
  margin-bottom: 0;
}

.form-actions {
  display: flex;
  gap: var(--spacing-md);
}

/* Favorites List */
.favorites-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.favorite-card {
  border: var(--border);
  background: var(--color-bg-card);
  transition: border-color var(--transition-fast);
}

.favorite-card:hover {
  border-color: var(--color-text);
}

.fav-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-sm) var(--spacing-md);
  border-bottom: var(--border-light);
}

.fav-label {
  font-weight: 500;
  font-size: var(--font-size-sm);
}

.fav-time {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  font-family: var(--font-mono);
}

.fav-body {
  padding: var(--spacing-sm) var(--spacing-md);
}

.fav-route {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: var(--font-size-sm);
}

.route-arrow {
  color: var(--color-text-muted);
}

.fav-footer {
  display: flex;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  border-top: var(--border-light);
}

.btn-sm {
  padding: var(--spacing-xs) var(--spacing-md);
  font-size: var(--font-size-xs);
}

.btn-danger {
  color: var(--color-danger);
  border-color: var(--color-danger);
}

.btn-danger:hover {
  background: var(--color-danger);
  color: #fff;
}

/* Responsive */
@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>
