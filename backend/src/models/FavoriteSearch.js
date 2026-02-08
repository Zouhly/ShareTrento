const mongoose = require('mongoose');

/**
 * FavoriteSearch Schema
 * Stores a user's saved search criteria for recurring trips.
 * Users can save origin/destination pairs with an optional preferred
 * departure time-of-day so they can quickly re-run searches.
 */
const favoriteSearchSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  label: {
    type: String,
    required: [true, 'A label for the favorite is required'],
    trim: true,
    maxlength: [100, 'Label cannot exceed 100 characters']
  },
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
  /** Optional preferred departure time expressed as "HH:mm" (24-h).
   *  If set the frontend can pre-fill the departure time input
   *  with today's (or tomorrow's) date at this time. */
  preferredTime: {
    type: String,
    trim: true,
    match: [/^([01]\d|2[0-3]):[0-5]\d$/, 'Preferred time must be in HH:mm format']
  }
}, {
  timestamps: true
});

// Indexes
favoriteSearchSchema.index({ userId: 1 });
// Prevent exact duplicates per user
favoriteSearchSchema.index(
  { userId: 1, origin: 1, destination: 1 },
  { unique: true }
);

const FavoriteSearch = mongoose.model('FavoriteSearch', favoriteSearchSchema);

module.exports = FavoriteSearch;
