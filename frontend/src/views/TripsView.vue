<template>
  <div class="trips-view">
    <h1>Available Trips</h1>

    <!-- Search Form -->
    <div class="search-card">
      <h3>Search Trips</h3>
      <form @submit.prevent="searchTrips" class="search-form">
        <div class="form-row">
          <div class="form-group">
            <label for="origin">Origin</label>
            <input
              type="text"
              id="origin"
              v-model="searchForm.origin"
              placeholder="e.g., Trento Centro"
            />
          </div>
          <div class="form-group">
            <label for="destination">Destination</label>
            <input
              type="text"
              id="destination"
              v-model="searchForm.destination"
              placeholder="e.g., Rovereto"
            />
          </div>
          <div class="form-group">
            <label for="departureTime">Departure Time</label>
            <input
              type="datetime-local"
              id="departureTime"
              v-model="searchForm.departureTime"
            />
          </div>
        </div>
        <div class="search-actions">
          <button type="submit" class="btn btn-primary">Search</button>
          <button type="button" class="btn btn-secondary" @click="loadAllTrips">Show All</button>
        </div>
      </form>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading">Loading trips...</div>

    <!-- Error State -->
    <div v-if="error" class="alert alert-error">{{ error }}</div>

    <!-- Success Message -->
    <div v-if="successMessage" class="alert alert-success">{{ successMessage }}</div>

    <!-- Trips List -->
    <div v-if="!loading && trips.length === 0" class="no-trips">
      <p>No trips found. Try adjusting your search criteria.</p>
    </div>

    <div class="trips-grid" v-if="trips.length > 0">
      <div v-for="trip in trips" :key="trip._id" class="trip-card">
        <div class="trip-header">
          <span class="trip-route">{{ trip.origin }} → {{ trip.destination }}</span>
          <span class="trip-seats" :class="{ 'low-seats': trip.availableSeats <= 1 }">
            {{ trip.availableSeats }} seat{{ trip.availableSeats !== 1 ? 's' : '' }}
          </span>
        </div>
        
        <div class="trip-details">
          <div class="trip-time">
            <span class="label">Departure:</span>
            <span>{{ formatDate(trip.departureTime) }}</span>
          </div>
          <div class="trip-driver">
            <span class="label">Driver:</span>
            <span>{{ trip.driverId?.name || 'Unknown' }}</span>
          </div>
        </div>

        <div class="trip-actions" v-if="canBook">
          <button 
            @click="joinTrip(trip._id)" 
            class="btn btn-primary"
            :disabled="trip.availableSeats === 0 || bookingInProgress"
          >
            {{ bookingInProgress === trip._id ? 'Booking...' : 'Join Trip' }}
          </button>
        </div>

        <div class="trip-actions" v-else-if="!isLoggedIn">
          <router-link to="/login" class="btn btn-secondary">Login to Book</router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { tripsApi, bookingsApi } from '../api'

export default {
  name: 'TripsView',
  data() {
    return {
      trips: [],
      loading: false,
      error: null,
      successMessage: null,
      bookingInProgress: null,
      searchForm: {
        origin: '',
        destination: '',
        departureTime: ''
      }
    }
  },
  computed: {
    isLoggedIn() {
      return !!localStorage.getItem('token')
    },
    canBook() {
      const user = JSON.parse(localStorage.getItem('user') || 'null')
      return user?.role === 'PASSENGER'
    }
  },
  async created() {
    await this.loadAllTrips()
  },
  methods: {
    async loadAllTrips() {
      this.loading = true
      this.error = null
      
      try {
        const response = await tripsApi.getAll()
        this.trips = response.data.data.trips
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to load trips'
      } finally {
        this.loading = false
      }
    },
    async searchTrips() {
      if (!this.searchForm.origin && !this.searchForm.destination && !this.searchForm.departureTime) {
        return this.loadAllTrips()
      }

      // If all search fields are filled, use the matching search
      if (this.searchForm.origin && this.searchForm.destination && this.searchForm.departureTime) {
        this.loading = true
        this.error = null
        
        try {
          const response = await tripsApi.search({
            origin: this.searchForm.origin,
            destination: this.searchForm.destination,
            departureTime: new Date(this.searchForm.departureTime).toISOString()
          })
          this.trips = response.data.data.trips
        } catch (err) {
          this.error = err.response?.data?.message || 'Search failed'
        } finally {
          this.loading = false
        }
      } else {
        // Use simple filter for partial searches
        this.loading = true
        this.error = null
        
        try {
          const params = {}
          if (this.searchForm.origin) params.origin = this.searchForm.origin
          if (this.searchForm.destination) params.destination = this.searchForm.destination
          
          const response = await tripsApi.getAll(params)
          this.trips = response.data.data.trips
        } catch (err) {
          this.error = err.response?.data?.message || 'Search failed'
        } finally {
          this.loading = false
        }
      }
    },
    async joinTrip(tripId) {
      this.bookingInProgress = tripId
      this.error = null
      this.successMessage = null
      
      try {
        await bookingsApi.join(tripId)
        this.successMessage = 'Successfully booked the trip!'
        // Reload trips to update seat count
        await this.loadAllTrips()
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to book trip'
      } finally {
        this.bookingInProgress = null
      }
    },
    formatDate(dateString) {
      const date = new Date(dateString)
      return date.toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  }
}
</script>

<style scoped>
.trips-view h1 {
  color: #2c3e50;
  margin-bottom: 1.5rem;
}

.search-card {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
}

.search-card h3 {
  margin-bottom: 1rem;
  color: #2c3e50;
}

.form-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
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

.form-group input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.search-actions {
  display: flex;
  gap: 1rem;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  text-decoration: none;
  display: inline-block;
  text-align: center;
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

.btn-secondary {
  background: #e2e8f0;
  color: #4a5568;
}

.btn-secondary:hover {
  background: #cbd5e0;
}

.loading {
  text-align: center;
  padding: 2rem;
  color: #666;
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

.no-trips {
  text-align: center;
  padding: 2rem;
  background: white;
  border-radius: 8px;
  color: #666;
}

.trips-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
}

.trip-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
}

.trip-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.trip-route {
  font-weight: 600;
  color: #2c3e50;
  font-size: 1.1rem;
}

.trip-seats {
  background: #c6f6d5;
  color: #276749;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.875rem;
}

.trip-seats.low-seats {
  background: #feebc8;
  color: #c05621;
}

.trip-details {
  margin-bottom: 1rem;
}

.trip-details > div {
  margin-bottom: 0.5rem;
}

.label {
  color: #718096;
  margin-right: 0.5rem;
}

.trip-actions {
  border-top: 1px solid #e2e8f0;
  padding-top: 1rem;
}

.trip-actions .btn {
  width: 100%;
}
</style>
