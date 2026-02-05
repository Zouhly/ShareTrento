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

    <!-- Main Content: List + Map Side by Side -->
    <div v-if="!loading" class="trips-content">
      <!-- Trips List Panel (Left) -->
      <div class="list-panel">
        <!-- Empty State -->
        <div v-if="trips.length === 0" class="empty-state">
          <p>No trips found. Try adjusting your search criteria.</p>
        </div>

        <!-- Trips List -->
        <div 
          v-for="trip in trips" 
          :key="trip._id" 
          :id="'trip-' + trip._id" 
          class="trip-card"
          :class="{ selected: selectedTrip?._id === trip._id }"
          @click="selectTrip(trip)"
        >
          <div class="card-header">
            <span class="trip-route">{{ formatLocation(trip.origin) }} - {{ formatLocation(trip.destination) }}</span>
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
            <div class="trip-detail">
              <span class="detail-label">Car</span>
              <span class="detail-value">{{ formatCar(trip.driverId?.car) }}</span>
            </div>
            <div class="trip-detail">
              <span class="detail-label">Price</span>
              <span class="detail-value price">{{ trip.price === 0 ? 'Free' : `EUR ${trip.price.toFixed(2)}` }}</span>
            </div>
          </div>

          <div class="card-footer" v-if="canBook">
            <button 
              @click.stop="joinTrip(trip._id)" 
              class="btn btn-primary btn-block"
              :disabled="trip.availableSeats === 0 || bookingInProgress"
            >
              {{ bookingInProgress === trip._id ? 'Booking...' : 'Join Trip' }}
            </button>
          </div>

          <div class="card-footer" v-else-if="!isLoggedIn">
            <router-link to="/login" class="btn btn-block" @click.stop>Login to Book</router-link>
          </div>
        </div>
      </div>

      <!-- Map Panel (Right - always visible) -->
      <div class="map-panel">
        <div class="map-header">
          <span class="map-label">{{ selectedTrip ? 'Selected Trip' : 'All Trips' }}</span>
          <button 
            v-if="selectedTrip" 
            class="btn btn-sm"
            @click="clearSelection"
          >
            Show All
          </button>
        </div>
        <div class="map-wrapper">
          <TripMap 
            v-if="displayedTrips.length > 0"
            :trips="displayedTrips" 
            @trip-click="selectTrip"
          />
          <div v-else class="map-empty">
            No trips to display on map
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { tripsApi, bookingsApi } from '../api'
import TripMap from '../components/TripMap.vue'

export default {
  name: 'TripsView',
  components: {
    TripMap
  },
  data() {
    return {
      trips: [],
      loading: false,
      error: null,
      successMessage: null,
      bookingInProgress: null,
      selectedTrip: null,
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
    },
    displayedTrips() {
      // If a trip is selected, show only that trip on the map
      // Otherwise show all trips
      if (this.selectedTrip) {
        return [this.selectedTrip]
      }
      return this.trips
    }
  },
  async created() {
    await this.loadAllTrips()
  },
  methods: {
    formatLocation(location) {
      // Handle both old string format and new object format
      if (typeof location === 'string') return location
      return location?.address || 'Unknown'
    },
    selectTrip(trip) {
      // Toggle selection - if clicking the same trip, deselect it
      if (this.selectedTrip?._id === trip._id) {
        this.selectedTrip = null
      } else {
        this.selectedTrip = trip
      }
    },
    clearSelection() {
      this.selectedTrip = null
    },
    async loadAllTrips() {
      this.loading = true
      this.error = null
      this.selectedTrip = null
      
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

      this.selectedTrip = null  // Clear selection when searching

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
    },
    formatCar(car) {
      if (!car) return 'N/A'
      const parts = []
      if (car.color) parts.push(car.color)
      if (car.brand) parts.push(car.brand)
      if (car.model) parts.push(car.model)
      return parts.join(' ') || 'N/A'
    }
  }
}
</script>

<style scoped>
.trips-view {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.page-header {
  margin-bottom: var(--spacing-md);
  flex-shrink: 0;
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
}

/* Search Card - Compact */
.search-card {
  border: var(--border);
  padding: var(--spacing-md) var(--spacing-lg);
  margin-bottom: var(--spacing-md);
  background: var(--color-bg-card);
  flex-shrink: 0;
}

.search-header {
  margin-bottom: var(--spacing-sm);
}

.search-label {
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

.search-actions {
  display: flex;
  gap: var(--spacing-md);
}

/* Main Content Layout - List Left (30%), Map Right (70%) */
.trips-content {
  display: grid;
  grid-template-columns: minmax(280px, 30%) 1fr;
  gap: var(--spacing-lg);
  height: calc(100vh - 320px);
  min-height: 400px;
}

/* List Panel (Left) */
.list-panel {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  overflow-y: auto;
  padding-right: var(--spacing-sm);
}

/* Custom scrollbar for list panel */
.list-panel::-webkit-scrollbar {
  width: 4px;
}

.list-panel::-webkit-scrollbar-track {
  background: transparent;
}

.list-panel::-webkit-scrollbar-thumb {
  background: var(--color-border-light);
}

.list-panel::-webkit-scrollbar-thumb:hover {
  background: var(--color-border);
}

/* Map Panel (Right) */
.map-panel {
  display: flex;
  flex-direction: column;
  border: var(--border);
  background: var(--color-bg-card);
  min-height: 0;
}

.map-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-sm) var(--spacing-md);
  border-bottom: var(--border-light);
  flex-shrink: 0;
}

.map-label {
  font-size: var(--font-size-xs);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--color-text-muted);
}

.map-wrapper {
  flex: 1;
  min-height: 0;
}

.map-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}

/* Trip Card - Compact */
.trip-card {
  border: var(--border);
  background: var(--color-bg-card);
  cursor: pointer;
  transition: all 0.15s ease;
  flex-shrink: 0;
}

.trip-card:hover {
  border-color: var(--color-text);
  transform: translateX(2px);
}

.trip-card.selected {
  border-color: var(--color-text);
  background: var(--color-bg);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-sm) var(--spacing-md);
  border-bottom: var(--border-light);
}

.trip-route {
  font-weight: 500;
  font-size: var(--font-size-sm);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
  margin-right: var(--spacing-sm);
}

.card-body {
  padding: var(--spacing-sm) var(--spacing-md);
}

.trip-detail {
  display: flex;
  justify-content: space-between;
  margin-bottom: var(--spacing-xs);
}

.trip-detail:last-child {
  margin-bottom: 0;
}

.detail-label {
  font-size: var(--font-size-xs);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-muted);
}

.detail-value {
  font-size: var(--font-size-xs);
}

.detail-value.price {
  font-weight: 600;
}

.card-footer {
  padding: var(--spacing-sm) var(--spacing-md);
  border-top: var(--border-light);
}

/* Button small variant */
.btn-sm {
  padding: var(--spacing-xs) var(--spacing-md);
  font-size: var(--font-size-xs);
}

/* Responsive - Stack on smaller screens */
@media (max-width: 768px) {
  .trips-content {
    grid-template-columns: 1fr;
    height: auto;
    gap: var(--spacing-md);
  }
  
  .list-panel {
    order: 2;
    max-height: 50vh;
    padding-right: 0;
  }
  
  .map-panel {
    order: 1;
    min-height: 300px;
  }
  
  .search-card {
    padding: var(--spacing-md);
  }
  
  .form-row {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .page-header h1 {
    font-size: var(--font-size-xl);
  }
  
  .trips-content {
    gap: var(--spacing-sm);
  }
  
  .map-panel {
    min-height: 250px;
  }
  
  .list-panel {
    max-height: 40vh;
  }
}
</style>
