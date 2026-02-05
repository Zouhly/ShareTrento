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
          <LocationPicker
            v-model="form.origin"
            input-id="origin"
            placeholder="Search for pickup location..."
            :show-map="true"
          />
        </div>

        <div class="form-group">
          <label for="destination">Destination</label>
          <LocationPicker
            v-model="form.destination"
            input-id="destination"
            placeholder="Search for drop-off location..."
            :show-map="true"
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

        <button type="submit" class="btn btn-primary btn-block" :disabled="loading || !isFormValid">
          {{ loading ? 'Creating...' : 'Create Trip' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script>
import { tripsApi } from '../api'
import LocationPicker from '../components/LocationPicker.vue'

export default {
  name: 'CreateTripView',
  components: {
    LocationPicker
  },
  data() {
    return {
      form: {
        origin: { address: '', lat: null, lng: null },
        destination: { address: '', lat: null, lng: null },
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
    },
    isFormValid() {
      return this.form.origin?.lat && 
             this.form.origin?.lng && 
             this.form.destination?.lat && 
             this.form.destination?.lng &&
             this.form.departureTime
    }
  },
  methods: {
    async handleSubmit() {
      if (!this.isFormValid) {
        this.error = 'Please select valid locations from the suggestions'
        return
      }

      this.loading = true
      this.error = null
      this.success = null

      try {
        const tripData = {
          origin: this.form.origin,
          destination: this.form.destination,
          departureTime: new Date(this.form.departureTime).toISOString(),
          availableSeats: this.form.availableSeats,
          price: this.form.price
        }

        await tripsApi.create(tripData)
        
        this.success = 'Trip created successfully!'
        
        this.form = {
          origin: { address: '', lat: null, lng: null },
          destination: { address: '', lat: null, lng: null },
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

/* Responsive */
@media (max-width: 768px) {
  .form-card {
    padding: var(--spacing-lg);
    max-width: 100%;
  }
}

@media (max-width: 480px) {
  .page-header h1 {
    font-size: var(--font-size-xl);
  }
  
  .form-card {
    padding: var(--spacing-md);
  }
}
</style>
