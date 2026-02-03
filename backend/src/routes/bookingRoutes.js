const express = require('express');
const router = express.Router();
const { bookingController } = require('../controllers');
const { authenticate, authorize } = require('../middleware');

/**
 * @swagger
 * /api/bookings:
 *   post:
 *     summary: Join a trip (create booking)
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     description: |
 *       Only PASSENGER role can book trips.
 *       Business rules:
 *       - Trip must have available seats
 *       - Cannot book same trip twice
 *       - Cannot book own trip
 *       - Joining decreases available seats by 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tripId
 *             properties:
 *               tripId:
 *                 type: string
 *                 description: ID of the trip to join
 *                 example: 507f1f77bcf86cd799439011
 *     responses:
 *       201:
 *         description: Booking created successfully
 *       400:
 *         description: No available seats or invalid request
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not a passenger
 *       404:
 *         description: Trip not found
 *       409:
 *         description: Already booked this trip
 */
router.post('/', authenticate, authorize('PASSENGER'), bookingController.joinTrip);

/**
 * @swagger
 * /api/bookings/my-bookings:
 *   get:
 *     summary: Get bookings for current user
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user's bookings
 *       401:
 *         description: Not authenticated
 */
router.get('/my-bookings', authenticate, bookingController.getMyBookings);

/**
 * @swagger
 * /api/bookings/trip/{tripId}:
 *   get:
 *     summary: Get bookings for a specific trip (driver view)
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     description: Only the driver who created the trip can view its bookings
 *     parameters:
 *       - in: path
 *         name: tripId
 *         required: true
 *         schema:
 *           type: string
 *         description: Trip ID
 *     responses:
 *       200:
 *         description: List of bookings for the trip
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized to view these bookings
 *       404:
 *         description: Trip not found
 */
router.get('/trip/:tripId', authenticate, authorize('DRIVER'), bookingController.getTripBookings);

/**
 * @swagger
 * /api/bookings/{id}/cancel:
 *   patch:
 *     summary: Cancel a booking
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     description: |
 *       Only the passenger who made the booking can cancel it.
 *       Cancelling restores a seat to the trip.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Booking ID
 *     responses:
 *       200:
 *         description: Booking cancelled successfully
 *       400:
 *         description: Booking already cancelled
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized to cancel this booking
 *       404:
 *         description: Booking not found
 */
router.patch('/:id/cancel', authenticate, authorize('PASSENGER'), bookingController.cancelBooking);

module.exports = router;
