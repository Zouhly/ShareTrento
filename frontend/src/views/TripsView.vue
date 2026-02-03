<template>
  <div class="trips-view">
    <div class="page-header">
      <h1>Available Trips</h1>
      <div class="header-line"></div>
    </div>

    <!-- Search Form -->
    <div class="search-card">
      <div class="search-header">
        <span class="search-label">Search</span>
      </div>
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
          <button type="button" class="btn" @click="loadAllTrips">Show All</button>
        </div>
      </form>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading">Loading...</div>

    <!-- Alerts -->
    <div v-if="error" class="alert alert-error">{{ error }}</div>
    <div v-if="successMessage" class="alert alert-success">{{ successMessage }}</div>

    <!-- Empty State -->
    <div v-if="!loading && trips.length === 0" class="empty-state">
      <p>No trips found. Try adjusting your search criteria.</p>
    </div>

    <!-- Trips Grid -->
    <div class="trips-grid" v-if="trips.length > 0">
      <div v-for="trip in trips" :key="trip._id" class="trip-card">
        <div class="card-header">
          <span class="trip-route">{{ trip.origin }} - {{ trip.destination }}</span>
          <span class="badge" :class="trip.availableSeats <= 1 ? 'badge-warning' : 'badge-success'">
            {{ trip.availableSeats }} seat{{ trip.availableSeats !== 1 ? 's' : '' }}
          </span>
        </div>
        
        <div class="card-body">
          <div class="trip-detail">
            <span class="detail-label">Departure</span>
            <span class="detail-value">{{ formatDate(trip.departureTime) }}</span>
          </div>
          <div class="trip-detail">
            <span class="detail-label">Driver</span>
            <span class="detail-value">{{ trip.driverId?.name || 'Unknown' }}</span>
          </div>
        </div>

        <div class="card-footer" v-if="canBook">
          <button 
            @click="joinTrip(trip._id)" 
            class="btn btn-primary btn-block"
            :disabled="trip.availableSeats === 0 || bookingInProgress"
          >
            {{ bookingInProgress === trip._id ? 'Booking...' : 'Join Trip' }}
          </button>
        </div>

        <div class="card-footer" v-else-if="!isLoggedIn">
          <router-link to="/login" class="btn btn-block">Login to Book</router-link>
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

/* Search Card */
.search-card {
  border: var(--border);
  padding: var(--spacing-xl);
  margin-bottom: var(--spacing-xl);
  background: var(--color-bg-card);
}

.search-header {
  margin-bottom: var(--spacing-lg);
}

.search-label {
  font-size: var(--font-size-sm);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--color-text-muted);
}

.form-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-lg);
}

.search-actions {
  display: flex;
  gap: var(--spacing-md);
}

/* Trips Grid */
.trips-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: var(--spacing-lg);
}

.trip-card {
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

.trip-route {
  font-weight: 500;
  font-size: var(--font-size-base);
}

.card-body {
  padding: var(--spacing-lg);
}

.trip-detail {
  display: flex;
  justify-content: space-between;
  margin-bottom: var(--spacing-sm);
}

.trip-detail:last-child {
  margin-bottom: 0;
}

.detail-label {
  font-size: var(--font-size-sm);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-muted);
}

.detail-value {
  font-size: var(--font-size-sm);
}

.card-footer {
  padding: var(--spacing-lg);
  border-top: var(--border-light);
}
</style>
