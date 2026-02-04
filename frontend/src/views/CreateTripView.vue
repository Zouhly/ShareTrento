<template>
  <div class="create-trip-view">
    <div class="page-header">
      <h1>Create Trip</h1>
      <div class="header-line"></div>
    </div>

    <div class="form-card">
      <div v-if="error" class="alert alert-error">{{ error }}</div>
      <div v-if="success" class="alert alert-success">{{ success }}</div>

      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label for="origin">Origin</label>
          <input
            type="text"
            id="origin"
            v-model="form.origin"
            required
            placeholder="e.g., Trento Centro"
          />
        </div>

        <div class="form-group">
          <label for="destination">Destination</label>
          <input
            type="text"
            id="destination"
            v-model="form.destination"
            required
            placeholder="e.g., Rovereto"
          />
        </div>

        <div class="form-group">
          <label for="departureTime">Departure Time</label>
          <input
            type="datetime-local"
            id="departureTime"
            v-model="form.departureTime"
            required
            :min="minDateTime"
          />
        </div>

        <div class="form-group">
          <label for="availableSeats">Available Seats</label>
          <input
            type="number"
            id="availableSeats"
            v-model.number="form.availableSeats"
            required
            min="1"
            max="8"
          />
          <small>Maximum 8 seats</small>
        </div>

        <div class="form-group">
          <label for="price">Price per Seat (EUR)</label>
          <input
            type="number"
            id="price"
            v-model.number="form.price"
            required
            min="0"
            max="1000"
            step="0.50"
          />
          <small>Set 0 for free rides</small>
        </div>

        <button type="submit" class="btn btn-primary btn-block" :disabled="loading">
          {{ loading ? 'Creating...' : 'Create Trip' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script>
import { tripsApi } from '../api'

export default {
  name: 'CreateTripView',
  data() {
    return {
      form: {
        origin: '',
        destination: '',
        departureTime: '',
        availableSeats: 3,
        price: 5
      },
      loading: false,
      error: null,
      success: null
    }
  },
  computed: {
    minDateTime() {
      const now = new Date()
      now.setHours(now.getHours() + 1)
      return now.toISOString().slice(0, 16)
    }
  },
  methods: {
    async handleSubmit() {
      this.loading = true
      this.error = null
      this.success = null

      try {
        const tripData = {
          ...this.form,
          departureTime: new Date(this.form.departureTime).toISOString()
        }

        await tripsApi.create(tripData)
        
        this.success = 'Trip created successfully!'
        
        this.form = {
          origin: '',
          destination: '',
          departureTime: '',
          availableSeats: 3,
          price: 5
        }

        setTimeout(() => {
          this.$router.push('/my-trips')
        }, 1500)
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to create trip'
      } finally {
        this.loading = false
      }
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

.form-card {
  border: var(--border);
  padding: var(--spacing-2xl);
  max-width: 500px;
  background: var(--color-bg-card);
}
</style>
