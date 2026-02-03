<template>
  <div class="my-bookings-view">
    <h1>My Bookings</h1>
    <p class="subtitle">Trips you have joined as a passenger</p>

    <div v-if="loading" class="loading">Loading your bookings...</div>
    <div v-if="error" class="alert alert-error">{{ error }}</div>
    <div v-if="success" class="alert alert-success">{{ success }}</div>

    <div v-if="!loading && bookings.length === 0" class="no-bookings">
      <p>You haven't booked any trips yet.</p>
      <router-link to="/trips" class="btn btn-primary">Browse Available Trips</router-link>
    </div>

    <div class="bookings-list" v-if="bookings.length > 0">
      <div v-for="booking in bookings" :key="booking._id" class="booking-card">
        <div class="booking-header">
          <span class="booking-route">
            {{ booking.tripId?.origin }} → {{ booking.tripId?.destination }}
          </span>
          <span class="booking-status" :class="`status-${booking.status.toLowerCase()}`">
            {{ booking.status }}
          </span>
        </div>
        
        <div class="booking-details">
          <div>
            <span class="label">Departure:</span>
            <span>{{ formatDate(booking.tripId?.departureTime) }}</span>
          </div>
          <div>
            <span class="label">Booked on:</span>
            <span>{{ formatDate(booking.createdAt) }}</span>
          </div>
        </div>

        <div class="booking-actions" v-if="booking.status === 'CONFIRMED' && isFutureTrip(booking)">
          <button 
            @click="cancelBooking(booking._id)" 
            class="btn btn-danger"
            :disabled="cancelling === booking._id"
          >
            {{ cancelling === booking._id ? 'Cancelling...' : 'Cancel Booking' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { bookingsApi } from '../api'

export default {
  name: 'MyBookingsView',
  data() {
    return {
      bookings: [],
      loading: false,
      error: null,
      success: null,
      cancelling: null
    }
  },
  async created() {
    await this.loadBookings()
  },
  methods: {
    async loadBookings() {
      this.loading = true
      this.error = null
      
      try {
        const response = await bookingsApi.getMyBookings()
        this.bookings = response.data.data.bookings
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to load bookings'
      } finally {
        this.loading = false
      }
    },
    async cancelBooking(bookingId) {
      if (!confirm('Are you sure you want to cancel this booking?')) {
        return
      }

      this.cancelling = bookingId
      this.error = null
      this.success = null
      
      try {
        await bookingsApi.cancel(bookingId)
        this.success = 'Booking cancelled successfully'
        // Reload bookings
        await this.loadBookings()
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to cancel booking'
      } finally {
        this.cancelling = null
      }
    },
    isFutureTrip(booking) {
      if (!booking.tripId?.departureTime) return false
      return new Date(booking.tripId.departureTime) > new Date()
    },
    formatDate(dateString) {
      if (!dateString) return 'N/A'
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
.my-bookings-view h1 {
  color: #2c3e50;
  margin-bottom: 0.5rem;
}

.subtitle {
  color: #718096;
  margin-bottom: 1.5rem;
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

.no-bookings {
  text-align: center;
  padding: 2rem;
  background: white;
  border-radius: 8px;
}

.no-bookings p {
  margin-bottom: 1rem;
  color: #666;
}

.bookings-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.booking-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
}

.booking-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.booking-route {
  font-weight: 600;
  color: #2c3e50;
  font-size: 1.1rem;
}

.booking-status {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.875rem;
}

.status-confirmed {
  background: #c6f6d5;
  color: #276749;
}

.status-cancelled {
  background: #fed7d7;
  color: #c53030;
}

.status-pending {
  background: #feebc8;
  color: #c05621;
}

.booking-details {
  margin-bottom: 1rem;
}

.booking-details > div {
  margin-bottom: 0.5rem;
}

.label {
  color: #718096;
  margin-right: 0.5rem;
}

.booking-actions {
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
