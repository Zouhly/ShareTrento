<template>
  <div class="create-trip-view">
    <div class="page-header">
      <h1>Create Trip</h1>
      <div class="header-line"></div>
    </div>

    <!-- No car warning -->
    <div v-if="!hasCarInfo" class="alert alert-warning no-car-warning">
      <p><strong>Car information required</strong></p>
      <p>You must add your car details before creating trips.</p>
      <router-link to="/profile" class="btn btn-primary">Go to Profile</router-link>
    </div>

    <div class="form-card" v-else>
      <div v-if="error" class="alert alert-error">{{ error }}</div>
      <div v-if="success" class="alert alert-success">{{ success }}</div>

      <!-- Car info display -->
      <div class="car-info-box">
        <span class="car-label">Your Car</span>
        <span class="car-value">{{ userCarInfo }}</span>
      </div>

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
            :max="maxSeats"
          />
          <small>Maximum {{ maxSeats }} seats (your car has {{ user?.car?.seats }} total)</small>
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
        availableSeats: 3
      },
      loading: false,
      error: null,
      success: null,
      user: null
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
             this.form.departureTime &&
             this.hasCarInfo
    },
    hasCarInfo() {
      return this.user?.car?.brand && this.user?.car?.model && this.user?.car?.seats
    },
    userCarInfo() {
      if (!this.user?.car) return 'Not set'
      const { color, brand, model, seats } = this.user.car
      return `${color || ''} ${brand} ${model} (${seats} seats)`.trim()
    },
    maxSeats() {
      // Max available seats is total seats minus driver
      return this.user?.car?.seats ? this.user.car.seats - 1 : 8
    }
  },
  created() {
    this.loadUser()
  },
  methods: {
    loadUser() {
      const userData = localStorage.getItem('user')
      this.user = userData ? JSON.parse(userData) : null
    },
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
          availableSeats: this.form.availableSeats
        }

        await tripsApi.create(tripData)
        
        this.success = 'Trip created successfully!'
        
        this.form = {
          origin: { address: '', lat: null, lng: null },
          destination: { address: '', lat: null, lng: null },
          departureTime: '',
          availableSeats: 3
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

/* No car warning */
.no-car-warning {
  max-width: 500px;
  padding: var(--spacing-xl);
  text-align: center;
}

.no-car-warning p {
  margin-bottom: var(--spacing-sm);
}

.no-car-warning p:first-child {
  margin-bottom: var(--spacing-md);
}

/* Car info box */
.car-info-box {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
  border: var(--border-light);
  background: var(--color-bg);
}

.car-label {
  font-size: var(--font-size-xs);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--color-text-muted);
}

.car-value {
  font-size: var(--font-size-sm);
  font-weight: 500;
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
