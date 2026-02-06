const { Booking, Trip } = require('../models');
const { sendBookingNotifications } = require('../utils/mailer');

/**
 * Join a trip (create booking)
 * POST /api/bookings
 * Protected: PASSENGER only
 * 
 * Business Rules:
 * - Can only join if availableSeats > 0
 * - Joining decreases availableSeats by 1
 * - Cannot book same trip twice
 * - Cannot book own trip (if somehow user is both driver and passenger)
 * 
 * Note: In a production environment with high concurrency, you would want
 * to use MongoDB transactions. For this educational project, we use
 * optimistic locking with findOneAndUpdate to handle the seat decrement atomically.
 */
const joinTrip = async (req, res, next) => {
  try {
    const { tripId } = req.body;

    if (!tripId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide tripId'
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

    // Check if trip is in the past
    if (trip.departureTime <= new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot book a trip that has already departed'
      });
    }

    // Check available seats
    if (trip.availableSeats <= 0) {
      return res.status(400).json({
        success: false,
        message: 'No available seats on this trip'
      });
    }

    // Check if user is the driver (shouldn't book own trip)
    if (trip.driverId.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot book your own trip'
      });
    }

    // Check for existing booking
    const existingBooking = await Booking.findOne({
      tripId: trip._id,
      passengerId: req.user._id,
      status: { $ne: 'CANCELLED' }
    });

    if (existingBooking) {
      return res.status(409).json({
        success: false,
        message: 'You have already booked this trip'
      });
    }

    // Atomically decrement seats (only if seats > 0)
    // This prevents race conditions where two passengers book the last seat
    const updatedTrip = await Trip.findOneAndUpdate(
      { _id: trip._id, availableSeats: { $gt: 0 } },
      { $inc: { availableSeats: -1 } },
      { new: true }
    );

    if (!updatedTrip) {
      return res.status(400).json({
        success: false,
        message: 'No available seats on this trip'
      });
    }

    // Create booking
    const booking = new Booking({
      tripId: trip._id,
      passengerId: req.user._id,
      status: 'CONFIRMED'
    });

    await booking.save();

    // Populate for response
    await booking.populate('tripId', 'origin destination departureTime');
    await booking.populate('passengerId', 'name email');

    // Send email notifications (non-blocking for booking flow)
    try {
      const tripWithDriver = await Trip.findById(trip._id)
        .populate('driverId', 'name email car');

      await sendBookingNotifications({
        trip: tripWithDriver,
        passenger: req.user
      });
    } catch (emailError) {
      // Log and continue so booking succeeds even if email fails
      console.warn('Booking notification email failed:', emailError.message);
    }

    res.status(201).json({
      success: true,
      message: 'Trip booked successfully',
      data: { booking }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Cancel a booking
 * PATCH /api/bookings/:id/cancel
 * Protected: PASSENGER only, can only cancel own bookings
 * 
 * Business Rules:
 * - Cancelling restores a seat
 */
const cancelBooking = async (req, res, next) => {
  try {
    // Use _skipPopulate to get raw ObjectIds for comparison
    const booking = await Booking.findById(req.params.id).setOptions({ _skipPopulate: true });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if user owns this booking
    if (booking.passengerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only cancel your own bookings'
      });
    }

    // Check if already cancelled
    if (booking.status === 'CANCELLED') {
      return res.status(400).json({
        success: false,
        message: 'Booking is already cancelled'
      });
    }

    // Find the trip and restore seat
    const trip = await Trip.findById(booking.tripId);

    if (trip && trip.departureTime > new Date()) {
      // Restore seat atomically
      await Trip.findByIdAndUpdate(
        booking.tripId,
        { $inc: { availableSeats: 1 } }
      );
    }

    // Update booking status
    booking.status = 'CANCELLED';
    await booking.save();

    // Populate for response
    await booking.populate('tripId', 'origin destination departureTime');
    await booking.populate('passengerId', 'name email');

    res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully',
      data: { booking }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get bookings for current user
 * GET /api/bookings/my-bookings
 * Protected: authenticated users
 */
const getMyBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find({ passengerId: req.user._id })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: { bookings }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get bookings for a specific trip (driver view)
 * GET /api/bookings/trip/:tripId
 * Protected: DRIVER only, can only view bookings for own trips
 */
const getTripBookings = async (req, res, next) => {
  try {
    const trip = await Trip.findById(req.params.tripId);

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found'
      });
    }

    // Check if user is the driver
    if (trip.driverId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only view bookings for your own trips'
      });
    }

    const bookings = await Booking.find({
      tripId: trip._id,
      status: 'CONFIRMED'
    });

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: { bookings }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  joinTrip,
  cancelBooking,
  getMyBookings,
  getTripBookings
};
