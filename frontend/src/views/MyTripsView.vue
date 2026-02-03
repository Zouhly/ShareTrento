<template>
  <div class="my-trips-view">
    <div class="page-header">
      <div class="header-content">
        <div>
          <h1>My Trips</h1>
          <p class="subtitle">Trips you have created as a driver</p>
        </div>
        <router-link to="/create-trip" class="btn btn-primary">+ New Trip</router-link>
      </div>
      <div class="header-line"></div>
    </div>

    <div v-if="loading" class="loading">Loading...</div>
    <div v-if="error" class="alert alert-error">{{ error }}</div>

    <div v-if="!loading && trips.length === 0" class="empty-state">
      <p>You haven't created any trips yet.</p>
      <router-link to="/create-trip" class="btn btn-primary">Create Your First Trip</router-link>
    </div>

    <div class="trips-list" v-if="trips.length > 0">
      <div v-for="trip in trips" :key="trip._id" class="trip-card">
        <div class="card-header">
          <span class="trip-route">{{ trip.origin }} - {{ trip.destination }}</span>
          <span class="badge" :class="getTripStatus(trip).class">
            {{ getTripStatus(trip).text }}
          </span>
        </div>
        
        <div class="card-body">
          <div class="trip-detail">
            <span class="detail-label">Departure</span>
            <span class="detail-value">{{ formatDate(trip.departureTime) }}</span>
          </div>
          <div class="trip-detail">
            <span class="detail-label">Available Seats</span>
            <span class="detail-value">{{ trip.availableSeats }}</span>
          </div>
        </div>

        <div class="passengers-section" v-if="tripBookings[trip._id]">
          <div class="passengers-header">
            <span class="detail-label">Passengers ({{ tripBookings[trip._id].length }})</span>
          </div>
          <ul v-if="tripBookings[trip._id].length > 0" class="passengers-list">
            <li v-for="booking in tripBookings[trip._id]" :key="booking._id">
              {{ booking.passengerId?.name }} / {{ booking.passengerId?.email }}
            </li>
          </ul>
          <p v-else class="no-passengers">No passengers yet</p>
        </div>

        <div class="card-footer">
          <button 
            @click="loadBookings(trip._id)" 
            class="btn btn-sm"
            v-if="!tripBookings[trip._id]"
          >
            View Passengers
          </button>
          <button 
            @click="deleteTrip(trip._id)" 
            class="btn btn-danger btn-sm"
            :disabled="deleting === trip._id"
          >
            {{ deleting === trip._id ? 'Deleting...' : 'Delete' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { tripsApi, bookingsApi } from '../api'

export default {
  name: 'MyTripsView',
  data() {
    return {
      trips: [],
      tripBookings: {},
      loading: false,
      error: null,
      deleting: null
    }
  },
  async created() {
    await this.loadTrips()
  },
  methods: {
    async loadTrips() {
      this.loading = true
      this.error = null
      
      try {
        const response = await tripsApi.getMyTrips()
        this.trips = response.data.data.trips
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to load trips'
      } finally {
        this.loading = false
      }
    },
    async loadBookings(tripId) {
      try {
        const response = await bookingsApi.getTripBookings(tripId)
        this.tripBookings = {
          ...this.tripBookings,
          [tripId]: response.data.data.bookings
        }
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to load bookings'
      }
    },
    async deleteTrip(tripId) {
      if (!confirm('Are you sure you want to delete this trip?')) {
        return
      }

      this.deleting = tripId
      this.error = null
      
      try {
        await tripsApi.delete(tripId)
        this.trips = this.trips.filter(t => t._id !== tripId)
        delete this.tripBookings[tripId]
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to delete trip'
      } finally {
        this.deleting = null
      }
    },
    getTripStatus(trip) {
      const now = new Date()
      const departure = new Date(trip.departureTime)
      
      if (departure < now) {
        return { text: 'Completed', class: 'badge-muted' }
      }
      if (trip.availableSeats === 0) {
        return { text: 'Full', class: 'badge-warning' }
      }
      return { text: 'Active', class: 'badge-success' }
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

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--spacing-md);
}

.page-header h1 {
  font-weight: 300;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: var(--spacing-xs);
}

.subtitle {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  margin: 0;
}

.header-line {
  width: 100%;
  height: 1px;
  background: var(--color-border);
}

.trips-list {
  display: flex;
  flex-direction: column;
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

.passengers-section {
  padding: var(--spacing-lg);
  border-top: var(--border-light);
  background: var(--color-bg);
}

.passengers-header {
  margin-bottom: var(--spacing-sm);
}

.passengers-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.passengers-list li {
  padding: var(--spacing-xs) 0;
  font-size: var(--font-size-sm);
  font-family: var(--font-mono);
}

.no-passengers {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  font-style: italic;
  margin: 0;
}

.card-footer {
  display: flex;
  gap: var(--spacing-md);
  padding: var(--spacing-lg);
  border-top: var(--border-light);
}
</style>
