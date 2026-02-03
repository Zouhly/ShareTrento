const express = require('express');
const router = express.Router();
const { tripController } = require('../controllers');
const { authenticate, authorize } = require('../middleware');

/**
 * @swagger
 * /api/trips:
 *   get:
 *     summary: Get all available trips
 *     tags: [Trips]
 *     parameters:
 *       - in: query
 *         name: origin
 *         schema:
 *           type: string
 *         description: Filter by origin (partial match)
 *       - in: query
 *         name: destination
 *         schema:
 *           type: string
 *         description: Filter by destination (partial match)
 *     responses:
 *       200:
 *         description: List of available trips
 */
router.get('/', tripController.getAllTrips);

/**
 * @swagger
 * /api/trips/search:
 *   post:
 *     summary: Search for matching trips
 *     tags: [Trips]
 *     description: |
 *       Find trips matching criteria:
 *       - Same origin (case-insensitive)
 *       - Same destination (case-insensitive)
 *       - Departure time within ±30 minutes
 *       - Has available seats
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - origin
 *               - destination
 *               - departureTime
 *             properties:
 *               origin:
 *                 type: string
 *                 example: Trento Centro
 *               destination:
 *                 type: string
 *                 example: Rovereto
 *               departureTime:
 *                 type: string
 *                 format: date-time
 *                 example: 2024-12-20T09:00:00Z
 *     responses:
 *       200:
 *         description: List of matching trips
 */
router.post('/search', tripController.searchTrips);

/**
 * @swagger
 * /api/trips/my-trips:
 *   get:
 *     summary: Get trips created by current driver
 *     tags: [Trips]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of driver's trips
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not a driver
 */
router.get('/my-trips', authenticate, authorize('DRIVER'), tripController.getMyTrips);

/**
 * @swagger
 * /api/trips/{id}:
 *   get:
 *     summary: Get a single trip by ID
 *     tags: [Trips]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Trip ID
 *     responses:
 *       200:
 *         description: Trip details
 *       404:
 *         description: Trip not found
 */
router.get('/:id', tripController.getTripById);

/**
 * @swagger
 * /api/trips:
 *   post:
 *     summary: Create a new trip
 *     tags: [Trips]
 *     security:
 *       - bearerAuth: []
 *     description: Only DRIVER role can create trips
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - origin
 *               - destination
 *               - departureTime
 *               - availableSeats
 *             properties:
 *               origin:
 *                 type: string
 *                 example: Trento Centro
 *               destination:
 *                 type: string
 *                 example: Rovereto
 *               departureTime:
 *                 type: string
 *                 format: date-time
 *                 example: 2024-12-20T09:00:00Z
 *               availableSeats:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 8
 *                 example: 3
 *     responses:
 *       201:
 *         description: Trip created successfully
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not a driver
 */
router.post('/', authenticate, authorize('DRIVER'), tripController.createTrip);

/**
 * @swagger
 * /api/trips/{id}:
 *   delete:
 *     summary: Delete a trip
 *     tags: [Trips]
 *     security:
 *       - bearerAuth: []
 *     description: Only the driver who created the trip can delete it
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Trip ID
 *     responses:
 *       200:
 *         description: Trip deleted successfully
 *       400:
 *         description: Cannot delete trip with active bookings
 *       403:
 *         description: Not authorized to delete this trip
 *       404:
 *         description: Trip not found
 */
router.delete('/:id', authenticate, authorize('DRIVER'), tripController.deleteTrip);

module.exports = router;
