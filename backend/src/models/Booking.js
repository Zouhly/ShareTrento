const mongoose = require('mongoose');

/**
 * Booking Schema
 * Represents a passenger's booking for a trip.
 * Status tracks the lifecycle of the booking.
 */
const bookingSchema = new mongoose.Schema({
  tripId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trip',
    required: [true, 'Trip ID is required']
  },
  passengerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Passenger ID is required']
  },
  status: {
    type: String,
    enum: {
      values: ['PENDING', 'CONFIRMED', 'CANCELLED'],
      message: 'Status must be PENDING, CONFIRMED, or CANCELLED'
    },
    default: 'CONFIRMED' // Simplified: bookings are auto-confirmed when seats available
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate bookings
bookingSchema.index({ tripId: 1, passengerId: 1 }, { unique: true });

// Indexes for common queries
bookingSchema.index({ passengerId: 1 });
bookingSchema.index({ tripId: 1 });

/**
 * Populate trip and passenger details when querying
 */
bookingSchema.pre(/^find/, function(next) {
  // Only populate if not explicitly disabled
  if (this.options._skipPopulate) {
    return next();
  }
  
  this.populate({
    path: 'tripId',
    select: 'origin destination departureTime availableSeats driverId'
  }).populate({
    path: 'passengerId',
    select: 'name email'
  });
  
  next();
});

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;
