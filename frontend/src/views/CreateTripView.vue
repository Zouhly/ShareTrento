<template>
  <div class="create-trip-view">
    <h1>Create a New Trip</h1>

    <div class="form-card">
      <div v-if="error" class="alert alert-error">{{ error }}</div>
      <div v-if="success" class="alert alert-success">{{ success }}</div>

      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label for="origin">Origin *</label>
          <input
            type="text"
            id="origin"
            v-model="form.origin"
            required
            placeholder="e.g., Trento Centro"
          />
        </div>

        <div class="form-group">
          <label for="destination">Destination *</label>
          <input
            type="text"
            id="destination"
            v-model="form.destination"
            required
            placeholder="e.g., Rovereto"
          />
        </div>

        <div class="form-group">
          <label for="departureTime">Departure Time *</label>
          <input
            type="datetime-local"
            id="departureTime"
            v-model="form.departureTime"
            required
            :min="minDateTime"
          />
        </div>

        <div class="form-group">
          <label for="availableSeats">Available Seats *</label>
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

        <button type="submit" class="btn btn-primary" :disabled="loading">
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
        availableSeats: 3
      },
      loading: false,
      error: null,
      success: null
    }
  },
  computed: {
    minDateTime() {
      // Minimum is now + 1 hour
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
        
        // Reset form
        this.form = {
          origin: '',
          destination: '',
          departureTime: '',
          availableSeats: 3
        }

        // Redirect to my trips after a delay
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
.create-trip-view h1 {
  color: #2c3e50;
  margin-bottom: 1.5rem;
}

.form-card {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  max-width: 500px;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: #555;
  font-weight: 500;
}

.form-group input {
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

.form-group small {
  color: #718096;
  font-size: 0.875rem;
}

.btn {
  width: 100%;
  padding: 0.75rem;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
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
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 1rem;
}

.alert-error {
  background: #fed7d7;
  color: #c53030;
}

.alert-success {
  background: #c6f6d5;
  color: #276749;
}
</style>
