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
            {{ formatLocation(booking.tripId?.origin) }} - {{ formatLocation(booking.tripId?.destination) }}
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

        <div class="card-footer" v-else-if="booking.status === 'CONFIRMED' && !isFutureTrip(booking)">
          <button
            v-if="!reviewedTrips[booking.tripId?._id]"
            @click="openReviewModal(booking)"
            class="btn btn-primary btn-sm"
          >
            Review Driver
          </button>
          <span v-else class="review-submitted">✓ Reviewed</span>
        </div>
      </div>
    </div>

    <!-- Review Modal -->
    <div v-if="showReviewModal" class="modal-overlay" @click.self="closeReviewModal">
      <div class="modal-card">
        <h3>Review Driver</h3>
        <p class="modal-trip">{{ formatLocation(reviewBooking?.tripId?.origin) }} &rarr; {{ formatLocation(reviewBooking?.tripId?.destination) }}</p>
        
        <div class="rating-selector">
          <span
            v-for="star in 5"
            :key="star"
            class="star"
            :class="{ active: star <= reviewForm.rating }"
            @click="reviewForm.rating = star"
          >&#9733;</span>
        </div>

        <div class="form-group">
          <label for="reviewComment">Comment (optional)</label>
          <textarea
            id="reviewComment"
            v-model="reviewForm.comment"
            placeholder="How was your ride?"
            rows="3"
            maxlength="500"
          ></textarea>
        </div>

        <div v-if="reviewError" class="alert alert-error">{{ reviewError }}</div>

        <div class="modal-actions">
          <button class="btn" @click="closeReviewModal">Cancel</button>
          <button class="btn btn-primary" @click="submitReview" :disabled="submittingReview">
            {{ submittingReview ? 'Submitting...' : 'Submit Review' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { bookingsApi, reviewsApi } from '../api'

export default {
  name: 'MyBookingsView',
  data() {
    return {
      bookings: [],
      loading: false,
      error: null,
      success: null,
      cancelling: null,
      showReviewModal: false,
      reviewBooking: null,
      reviewForm: { rating: 5, comment: '' },
      reviewError: null,
      submittingReview: false,
      reviewedTrips: {}
    }
  },
  async created() {
    await this.loadBookings()
    await this.loadMyReviews()
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
    formatLocation(location) {
      if (typeof location === 'string') return location
      return location?.address || 'Unknown'
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
    },
    async loadMyReviews() {
      try {
        const res = await reviewsApi.getMyReviews()
        const reviews = res.data.data.reviews
        const map = {}
        for (const r of reviews) {
          const tripId = typeof r.tripId === 'string' ? r.tripId : r.tripId?._id
          if (tripId) map[tripId] = true
        }
        this.reviewedTrips = map
      } catch (e) {
        // Ignore
      }
    },
    openReviewModal(booking) {
      this.reviewBooking = booking
      this.reviewForm = { rating: 5, comment: '' }
      this.reviewError = null
      this.showReviewModal = true
    },
    closeReviewModal() {
      this.showReviewModal = false
      this.reviewBooking = null
    },
    async submitReview() {
      this.submittingReview = true
      this.reviewError = null
      try {
        const tripId = this.reviewBooking.tripId?._id || this.reviewBooking.tripId
        await reviewsApi.create({
          tripId,
          rating: this.reviewForm.rating,
          comment: this.reviewForm.comment || undefined
        })
        this.reviewedTrips = { ...this.reviewedTrips, [tripId]: true }
        this.success = 'Review submitted successfully!'
        this.closeReviewModal()
      } catch (err) {
        this.reviewError = err.response?.data?.message || 'Failed to submit review'
      } finally {
        this.submittingReview = false
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

.review-submitted {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}

/* Review Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-card {
  background: var(--color-bg-card);
  border: var(--border);
  padding: var(--spacing-2xl);
  max-width: 420px;
  width: 90%;
}

.modal-card h3 {
  font-weight: 300;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: var(--spacing-sm);
}

.modal-trip {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  margin-bottom: var(--spacing-lg);
}

.rating-selector {
  display: flex;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-lg);
}

.rating-selector .star {
  font-size: 1.8rem;
  cursor: pointer;
  color: var(--color-border);
  transition: color 0.15s;
}

.rating-selector .star.active {
  color: #f5a623;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-md);
  margin-top: var(--spacing-lg);
}

/* Responsive */
@media (max-width: 768px) {
  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-sm);
  }
  
  .booking-route {
    word-break: break-word;
  }
  
  .card-body,
  .card-footer {
    padding: var(--spacing-md);
  }
}

@media (max-width: 480px) {
  .page-header h1 {
    font-size: var(--font-size-xl);
  }
  
  .booking-detail {
    flex-direction: column;
    gap: var(--spacing-xs);
  }
}
</style>
