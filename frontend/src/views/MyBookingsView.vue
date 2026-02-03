<template>
  <div class="my-bookings-view">
    <div class="page-header">
      <h1>My Bookings</h1>
      <p class="subtitle">Trips you have joined as a passenger</p>
      <div class="header-line"></div>
    </div>

    <div v-if="loading" class="loading">Loading...</div>
    <div v-if="error" class="alert alert-error">{{ error }}</div>
    <div v-if="success" class="alert alert-success">{{ success }}</div>

    <div v-if="!loading && bookings.length === 0" class="empty-state">
      <p>You haven't booked any trips yet.</p>
      <router-link to="/trips" class="btn btn-primary">Browse Available Trips</router-link>
    </div>

    <div class="bookings-list" v-if="bookings.length > 0">
      <div v-for="booking in bookings" :key="booking._id" class="booking-card">
        <div class="card-header">
          <span class="booking-route">
            {{ booking.tripId?.origin }} - {{ booking.tripId?.destination }}
          </span>
          <span class="badge" :class="`badge-${getStatusClass(booking.status)}`">
            {{ booking.status }}
          </span>
        </div>
        
        <div class="card-body">
          <div class="booking-detail">
            <span class="detail-label">Departure</span>
            <span class="detail-value">{{ formatDate(booking.tripId?.departureTime) }}</span>
          </div>
          <div class="booking-detail">
            <span class="detail-label">Booked On</span>
            <span class="detail-value">{{ formatDate(booking.createdAt) }}</span>
          </div>
        </div>

        <div class="card-footer" v-if="booking.status === 'CONFIRMED' && isFutureTrip(booking)">
          <button 
            @click="cancelBooking(booking._id)" 
            class="btn btn-danger btn-sm"
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
    getStatusClass(status) {
      switch (status) {
        case 'CONFIRMED': return 'success'
        case 'CANCELLED': return 'danger'
        default: return 'warning'
      }
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
.page-header {
  margin-bottom: var(--spacing-xl);
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
  margin-bottom: var(--spacing-md);
}

.header-line {
  width: 100%;
  height: 1px;
  background: var(--color-border);
}

.bookings-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.booking-card {
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

.booking-route {
  font-weight: 500;
}

.card-body {
  padding: var(--spacing-lg);
}

.booking-detail {
  display: flex;
  justify-content: space-between;
  margin-bottom: var(--spacing-sm);
}

.booking-detail:last-child {
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
