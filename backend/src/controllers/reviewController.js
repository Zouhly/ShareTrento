const { Review, Trip, Booking } = require('../models');

/**
 * Create a review for a driver
 * POST /api/reviews
 * Protected: PASSENGER only
 * 
 * Business Rules:
 * - Can only review a trip that the passenger has a CONFIRMED booking for
 * - Trip must have already departed (completed)
 * - Cannot review the same trip twice
 */
const createReview = async (req, res, next) => {
  try {
    const { tripId, rating, comment } = req.body;

    if (!tripId || rating === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Please provide tripId and rating'
      });
    }

    if (rating < 1 || rating > 5 || !Number.isInteger(rating)) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be an integer between 1 and 5'
      });
    }

    // Find the trip
    const trip = await Trip.findById(tripId);

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found'
      });
    }

    // Trip must be completed (departure time in the past)
    if (trip.departureTime > new Date()) {
      return res.status(400).json({
        success: false,
        message: 'You can only review a trip after it has departed'
      });
    }

    // Check that the user has a confirmed booking for this trip
    const booking = await Booking.findOne({
      tripId: trip._id,
      passengerId: req.user._id,
      status: 'CONFIRMED'
    }).setOptions({ _skipPopulate: true });

    if (!booking) {
      return res.status(403).json({
        success: false,
        message: 'You can only review trips you have booked'
      });
    }

    // Check for existing review
    const existingReview = await Review.findOne({
      tripId: trip._id,
      reviewerId: req.user._id
    }).setOptions({ _skipPopulate: true });

    if (existingReview) {
      return res.status(409).json({
        success: false,
        message: 'You have already reviewed this trip'
      });
    }

    // Create the review
    const review = new Review({
      tripId: trip._id,
      reviewerId: req.user._id,
      driverId: trip.driverId,
      rating,
      comment: comment || undefined
    });

    await review.save();

    // Populate for response
    await review.populate('reviewerId', 'name email');

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      data: { review }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get reviews for a specific driver
 * GET /api/reviews/driver/:driverId
 */
const getDriverReviews = async (req, res, next) => {
  try {
    const { driverId } = req.params;

    const reviews = await Review.find({ driverId })
      .sort({ createdAt: -1 });

    const rating = await Review.getDriverRating(driverId);

    res.status(200).json({
      success: true,
      data: {
        reviews,
        averageRating: rating.average,
        reviewCount: rating.count
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get reviews written by the current user
 * GET /api/reviews/my-reviews
 * Protected: authenticated users
 */
const getMyReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ reviewerId: req.user._id })
      .populate('tripId', 'origin destination departureTime')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: reviews.length,
      data: { reviews }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createReview,
  getDriverReviews,
  getMyReviews
};
