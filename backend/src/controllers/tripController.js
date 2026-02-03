const { Trip, Booking } = require('../models');

/**
 * Create a new trip
 * POST /api/trips
 * Protected: DRIVER only
 */
const createTrip = async (req, res, next) => {
  try {
    const { origin, destination, departureTime, availableSeats } = req.body;

    // Validate required fields
    if (!origin || !destination || !departureTime || availableSeats === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Please provide origin, destination, departureTime, and availableSeats'
      });
    }

    // Validate availableSeats
    if (availableSeats < 1 || availableSeats > 8) {
      return res.status(400).json({
        success: false,
        message: 'Available seats must be between 1 and 8'
      });
    }

    // Validate departure time is in the future
    if (new Date(departureTime) <= new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Departure time must be in the future'
      });
    }

    // Create trip with current user as driver
    const trip = new Trip({
      origin,
      destination,
      departureTime: new Date(departureTime),
      availableSeats,
      driverId: req.user._id
    });

    await trip.save();

    // Populate driver info for response
    await trip.populate('driverId', 'name email');

    res.status(201).json({
      success: true,
      message: 'Trip created successfully',
      data: { trip }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all trips
 * GET /api/trips
 * Public or authenticated - returns all available trips
 */
const getAllTrips = async (req, res, next) => {
  try {
    // Only return future trips with available seats by default
    const query = {
      departureTime: { $gt: new Date() },
      availableSeats: { $gt: 0 }
    };

    // Optional filters
    if (req.query.origin) {
      query.origin = { $regex: new RegExp(req.query.origin, 'i') };
    }
    if (req.query.destination) {
      query.destination = { $regex: new RegExp(req.query.destination, 'i') };
    }

    const trips = await Trip.find(query)
      .populate('driverId', 'name email')
      .sort({ departureTime: 1 });

    res.status(200).json({
      success: true,
      count: trips.length,
      data: { trips }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a single trip by ID
 * GET /api/trips/:id
 */
const getTripById = async (req, res, next) => {
  try {
    const trip = await Trip.findById(req.params.id)
      .populate('driverId', 'name email');

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found'
      });
    }

    res.status(200).json({
      success: true,
      data: { trip }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Search for matching trips
 * POST /api/trips/search
 * Uses matching rules: same origin, same destination, ±30 minutes
 */
const searchTrips = async (req, res, next) => {
  try {
    const { origin, destination, departureTime } = req.body;

    if (!origin || !destination || !departureTime) {
      return res.status(400).json({
        success: false,
        message: 'Please provide origin, destination, and departureTime'
      });
    }

    const trips = await Trip.findMatchingTrips({
      origin,
      destination,
      departureTime
    });

    res.status(200).json({
      success: true,
      count: trips.length,
      data: { trips }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get trips created by the current driver
 * GET /api/trips/my-trips
 * Protected: DRIVER only
 */
const getMyTrips = async (req, res, next) => {
  try {
    const trips = await Trip.find({ driverId: req.user._id })
      .sort({ departureTime: -1 });

    res.status(200).json({
      success: true,
      count: trips.length,
      data: { trips }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a trip
 * DELETE /api/trips/:id
 * Protected: DRIVER only, can only delete own trips
 */
const deleteTrip = async (req, res, next) => {
  try {
    const trip = await Trip.findById(req.params.id);

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found'
      });
    }

    // Check if user is the driver of this trip
    if (trip.driverId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own trips'
      });
    }

    // Check if there are any confirmed bookings
    const activeBookings = await Booking.countDocuments({
      tripId: trip._id,
      status: 'CONFIRMED'
    });

    if (activeBookings > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete trip with active bookings'
      });
    }

    await Trip.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Trip deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTrip,
  getAllTrips,
  getTripById,
  searchTrips,
  getMyTrips,
  deleteTrip
};
