const mongoose = require('mongoose');

/**
 * Review Schema
 * Represents a passenger's review of a driver after a completed trip.
 * Rating is 1–5 stars, with an optional comment.
 */
const reviewSchema = new mongoose.Schema({
  tripId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trip',
    required: [true, 'Trip ID is required']
  },
  reviewerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Reviewer ID is required']
  },
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Driver ID is required']
  },
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5'],
    validate: {
      validator: Number.isInteger,
      message: 'Rating must be an integer'
    }
  },
  comment: {
    type: String,
    trim: true,
    maxlength: [500, 'Comment cannot exceed 500 characters']
  }
}, {
  timestamps: true
});

// A passenger can only review a driver once per trip
reviewSchema.index({ tripId: 1, reviewerId: 1 }, { unique: true });

// Indexes for common queries
reviewSchema.index({ driverId: 1 });
reviewSchema.index({ reviewerId: 1 });

/**
 * Populate trip and user details when querying
 */
reviewSchema.pre(/^find/, function(next) {
  if (this.options._skipPopulate) {
    return next();
  }

  this.populate({
    path: 'reviewerId',
    select: 'name email'
  });

  next();
});

/**
 * Get the average rating for a driver
 * @param {ObjectId} driverId - The driver's user ID
 * @returns {Promise<{average: number, count: number}>}
 */
reviewSchema.statics.getDriverRating = async function(driverId) {
  const result = await this.aggregate([
    { $match: { driverId: new mongoose.Types.ObjectId(driverId) } },
    {
      $group: {
        _id: '$driverId',
        averageRating: { $avg: '$rating' },
        reviewCount: { $sum: 1 }
      }
    }
  ]);

  if (result.length === 0) {
    return { average: 0, count: 0 };
  }

  return {
    average: Math.round(result[0].averageRating * 10) / 10,
    count: result[0].reviewCount
  };
};

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
