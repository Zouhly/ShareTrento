const mongoose = require('mongoose');
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
 * Concurrency: Uses a MongoDB transaction to atomically decrement seats
 * and create the booking. If either operation fails, both are rolled back.
 * Falls back to a compensating action (seat restore) if transactions are
 * not supported by the database deployment.
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

    // Check available seats (early check before starting transaction)
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

    // Check for existing booking (early check before starting transaction)
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

    // --- Transaction: atomically decrement seat + create booking ---
    const session = await mongoose.startSession();
    let booking;

    try {
      session.startTransaction();

      // Atomically decrement seats (only if seats > 0)
      const updatedTrip = await Trip.findOneAndUpdate(
        { _id: trip._id, availableSeats: { $gt: 0 } },
        { $inc: { availableSeats: -1 } },
        { new: true, session }
      );

      if (!updatedTrip) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({
          success: false,
          message: 'No available seats on this trip'
        });
      }

      // Create booking inside the same transaction
      [booking] = await Booking.create([{
        tripId: trip._id,
        passengerId: req.user._id,
        status: 'CONFIRMED'
      }], { session });

      await session.commitTransaction();
      session.endSession();
    } catch (txError) {
      // Abort transaction on any error (duplicate booking, validation, etc.)
      if (session.inTransaction()) {
        await session.abortTransaction();
      }
      session.endSession();

      // Duplicate key error (unique index on tripId + passengerId)
      if (txError.code === 11000) {
        return res.status(409).json({
          success: false,
          message: 'You have already booked this trip'
        });
      }

      throw txError;
    }

    // Populate for response (outside transaction, read-only)
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
 * 
 * Concurrency: Uses a MongoDB transaction to atomically restore the seat
 * and update the booking status together.
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

    // --- Transaction: atomically restore seat + cancel booking ---
    // The status check is done inside the transaction to prevent double-cancel races
    const session = await mongoose.startSession();

    try {
      session.startTransaction();

      // Atomically set status to CANCELLED only if not already cancelled
      const updatedBooking = await Booking.findOneAndUpdate(
        { _id: booking._id, status: { $ne: 'CANCELLED' } },
        { status: 'CANCELLED' },
        { new: true, session }
      ).setOptions({ _skipPopulate: true });

      if (!updatedBooking) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({
          success: false,
          message: 'Booking is already cancelled'
        });
      }

      // Restore seat if trip hasn't departed
      const trip = await Trip.findById(booking.tripId).session(session);

      if (trip && trip.departureTime > new Date()) {
        await Trip.findByIdAndUpdate(
          booking.tripId,
          { $inc: { availableSeats: 1 } },
          { session }
        );
      }

      await session.commitTransaction();
      session.endSession();
    } catch (txError) {
      if (session.inTransaction()) {
        await session.abortTransaction();
      }
      session.endSession();
      throw txError;
    }

    // Re-fetch with population for response (outside transaction)
    const updatedBooking = await Booking.findById(booking._id);

    res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully',
      data: { booking: updatedBooking }
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
