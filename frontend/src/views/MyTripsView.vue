<template>
  <div class="my-trips-view">
    <h1>My Trips</h1>
    <p class="subtitle">Trips you have created as a driver</p>

    <router-link to="/create-trip" class="btn btn-primary create-btn">
      + Create New Trip
    </router-link>

    <div v-if="loading" class="loading">Loading your trips...</div>
    <div v-if="error" class="alert alert-error">{{ error }}</div>

    <div v-if="!loading && trips.length === 0" class="no-trips">
      <p>You haven't created any trips yet.</p>
      <router-link to="/create-trip" class="btn btn-primary">Create Your First Trip</router-link>
    </div>

    <div class="trips-list" v-if="trips.length > 0">
      <div v-for="trip in trips" :key="trip._id" class="trip-card">
        <div class="trip-header">
          <span class="trip-route">{{ trip.origin }} → {{ trip.destination }}</span>
          <span class="trip-status" :class="getTripStatus(trip).class">
            {{ getTripStatus(trip).text }}
          </span>
        </div>
        
        <div class="trip-details">
          <div>
            <span class="label">Departure:</span>
            <span>{{ formatDate(trip.departureTime) }}</span>
          </div>
          <div>
            <span class="label">Available Seats:</span>
            <span>{{ trip.availableSeats }}</span>
          </div>
        </div>

        <div class="trip-bookings" v-if="tripBookings[trip._id]">
          <h4>Passengers ({{ tripBookings[trip._id].length }})</h4>
          <ul v-if="tripBookings[trip._id].length > 0">
            <li v-for="booking in tripBookings[trip._id]" :key="booking._id">
              {{ booking.passengerId?.name }} ({{ booking.passengerId?.email }})
            </li>
          </ul>
          <p v-else class="no-passengers">No passengers yet</p>
        </div>

        <div class="trip-actions">
          <button 
            @click="loadBookings(trip._id)" 
            class="btn btn-secondary"
            v-if="!tripBookings[trip._id]"
          >
            View Passengers
          </button>
          <button 
            @click="deleteTrip(trip._id)" 
            class="btn btn-danger"
            :disabled="deleting === trip._id"
          >
            {{ deleting === trip._id ? 'Deleting...' : 'Delete Trip' }}
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
        return { text: 'Completed', class: 'status-completed' }
      }
      if (trip.availableSeats === 0) {
        return { text: 'Full', class: 'status-full' }
      }
      return { text: 'Active', class: 'status-active' }
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
.my-trips-view h1 {
  color: #2c3e50;
  margin-bottom: 0.5rem;
}

.subtitle {
  color: #718096;
  margin-bottom: 1.5rem;
}

.create-btn {
  display: inline-block;
  margin-bottom: 1.5rem;
  text-decoration: none;
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

.no-trips {
  text-align: center;
  padding: 2rem;
  background: white;
  border-radius: 8px;
}

.no-trips p {
  margin-bottom: 1rem;
  color: #666;
}

.trips-list {
  display: flex;
  flex-direction: column;
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

.trip-status {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.875rem;
}

.status-active {
  background: #c6f6d5;
  color: #276749;
}

.status-full {
  background: #feebc8;
  color: #c05621;
}

.status-completed {
  background: #e2e8f0;
  color: #4a5568;
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

.trip-bookings {
  background: #f7fafc;
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 1rem;
}

.trip-bookings h4 {
  margin-bottom: 0.5rem;
  color: #2c3e50;
}

.trip-bookings ul {
  list-style: none;
  padding: 0;
}

.trip-bookings li {
  padding: 0.25rem 0;
  color: #4a5568;
}

.no-passengers {
  color: #718096;
  font-style: italic;
}

.trip-actions {
  display: flex;
  gap: 1rem;
  border-top: 1px solid #e2e8f0;
  padding-top: 1rem;
}

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  font-size: 0.875rem;
  cursor: pointer;
  text-decoration: none;
}

.btn-primary {
  background: #667eea;
  color: white;
}

.btn-secondary {
  background: #e2e8f0;
  color: #4a5568;
}

.btn-danger {
  background: #fc8181;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: #f56565;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
