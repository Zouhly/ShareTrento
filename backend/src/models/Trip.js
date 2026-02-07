const mongoose = require('mongoose');

/**
 * Location subdocument schema
 * Stores address string and geographic coordinates
 */
const locationSchema = new mongoose.Schema({
  address: {
    type: String,
    required: [true, 'Address is required'],
    trim: true,
    maxlength: [200, 'Address cannot exceed 200 characters']
  },
  lat: {
    type: Number,
    required: [true, 'Latitude is required'],
    min: [-90, 'Latitude must be between -90 and 90'],
    max: [90, 'Latitude must be between -90 and 90']
  },
  lng: {
    type: Number,
    required: [true, 'Longitude is required'],
    min: [-180, 'Longitude must be between -180 and 180'],
    max: [180, 'Longitude must be between -180 and 180']
  }
}, { _id: false });

/**
 * Trip Schema
 * Represents a trip offered by a DRIVER.
 * Passengers can join if there are available seats.
 */
const tripSchema = new mongoose.Schema({
  origin: {
    type: locationSchema,
    required: [true, 'Origin is required']
  },
  destination: {
    type: locationSchema,
    required: [true, 'Destination is required']
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
tripSchema.index({ 'origin.address': 1, 'destination.address': 1 });
tripSchema.index({ departureTime: 1 });
tripSchema.index({ driverId: 1 });
// Geospatial index for location-based queries
tripSchema.index({ 'origin.lat': 1, 'origin.lng': 1 });
tripSchema.index({ 'destination.lat': 1, 'destination.lng': 1 });

/**
 * Find matching trips based on matching rules:
 * - Origin within ~5km radius (or matching address)
 * - Destination within ~5km radius (or matching address)
 * - Departure time within ±30 minutes
 * - Has available seats
 * 
 * @param {Object} criteria - Search criteria
 * @param {Object} criteria.origin - Origin location {address, lat, lng}
 * @param {Object} criteria.destination - Destination location {address, lat, lng}
 * @param {Date} criteria.departureTime - Desired departure time
 * @returns {Promise<Array>} - Array of matching trips
 */
tripSchema.statics.findMatchingTrips = async function(criteria) {
  const { origin, destination, departureTime } = criteria;
  
  // Calculate time window: ±30 minutes
  const TIME_WINDOW_MS = 30 * 60 * 1000;
  const targetTime = new Date(departureTime);
  const minTime = new Date(targetTime.getTime() - TIME_WINDOW_MS);
  const maxTime = new Date(targetTime.getTime() + TIME_WINDOW_MS);
  
  // If coordinates provided, search by proximity (~5km radius ≈ 0.045 degrees)
  const RADIUS_DEGREES = 0.045;
  
  const query = {
    departureTime: { $gte: minTime, $lte: maxTime },
    availableSeats: { $gt: 0 }
  };

  // Origin matching - by coordinates if available, otherwise by address
  if (origin.lat && origin.lng) {
    query['origin.lat'] = { $gte: origin.lat - RADIUS_DEGREES, $lte: origin.lat + RADIUS_DEGREES };
    query['origin.lng'] = { $gte: origin.lng - RADIUS_DEGREES, $lte: origin.lng + RADIUS_DEGREES };
  } else if (origin.address) {
    query['origin.address'] = { $regex: new RegExp(origin.address, 'i') };
  }

  // Destination matching
  if (destination.lat && destination.lng) {
    query['destination.lat'] = { $gte: destination.lat - RADIUS_DEGREES, $lte: destination.lat + RADIUS_DEGREES };
    query['destination.lng'] = { $gte: destination.lng - RADIUS_DEGREES, $lte: destination.lng + RADIUS_DEGREES };
  } else if (destination.address) {
    query['destination.address'] = { $regex: new RegExp(destination.address, 'i') };
  }
  
  return this.find(query).populate('driverId', 'name email car');
};

const Trip = mongoose.model('Trip', tripSchema);

module.exports = Trip;
