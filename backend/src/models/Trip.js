const mongoose = require('mongoose');

/**
 * Trip Schema
 * Represents a trip offered by a DRIVER.
 * Passengers can join if there are available seats.
 */
const tripSchema = new mongoose.Schema({
  origin: {
    type: String,
    required: [true, 'Origin is required'],
    trim: true,
    maxlength: [200, 'Origin cannot exceed 200 characters']
  },
  destination: {
    type: String,
    required: [true, 'Destination is required'],
    trim: true,
    maxlength: [200, 'Destination cannot exceed 200 characters']
  },
  departureTime: {
    type: Date,
    required: [true, 'Departure time is required'],
    validate: {
      validator: function(value) {
        // Departure time must be in the future (when creating)
        // Skip validation if document is not new (for updates)
        if (this.isNew) {
          return value > new Date();
        }
        return true;
      },
      message: 'Departure time must be in the future'
    }
  },
  availableSeats: {
    type: Number,
    required: [true, 'Available seats is required'],
    min: [0, 'Available seats cannot be negative'],
    max: [8, 'Available seats cannot exceed 8'],
    validate: {
      validator: Number.isInteger,
      message: 'Available seats must be an integer'
    }
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative'],
    max: [1000, 'Price cannot exceed 1000']
  },
  // Reference to the driver who created this trip
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Driver ID is required']
  }
}, {
  timestamps: true
});

// Indexes for common queries
tripSchema.index({ origin: 1, destination: 1 });
tripSchema.index({ departureTime: 1 });
tripSchema.index({ driverId: 1 });

/**
 * Find matching trips based on matching rules:
 * - Same origin
 * - Same destination  
 * - Departure time within ±30 minutes
 * - Has available seats
 * 
 * @param {Object} criteria - Search criteria
 * @param {string} criteria.origin - Trip origin
 * @param {string} criteria.destination - Trip destination
 * @param {Date} criteria.departureTime - Desired departure time
 * @returns {Promise<Array>} - Array of matching trips
 */
tripSchema.statics.findMatchingTrips = async function(criteria) {
  const { origin, destination, departureTime } = criteria;
  
  // Calculate time window: ±30 minutes
  const TIME_WINDOW_MS = 30 * 60 * 1000; // 30 minutes in milliseconds
  const targetTime = new Date(departureTime);
  const minTime = new Date(targetTime.getTime() - TIME_WINDOW_MS);
  const maxTime = new Date(targetTime.getTime() + TIME_WINDOW_MS);
  
  return this.find({
    origin: { $regex: new RegExp(`^${origin}$`, 'i') }, // Case-insensitive match
    destination: { $regex: new RegExp(`^${destination}$`, 'i') },
    departureTime: { $gte: minTime, $lte: maxTime },
    availableSeats: { $gt: 0 }
  }).populate('driverId', 'name email car');
};

const Trip = mongoose.model('Trip', tripSchema);

module.exports = Trip;
