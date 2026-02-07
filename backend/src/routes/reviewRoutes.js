const express = require('express');
const router = express.Router();
const { reviewController } = require('../controllers');
const { authenticate, authorize } = require('../middleware');

/**
 * @swagger
 * /api/reviews:
 *   post:
 *     summary: Submit a review for a driver
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     description: |
 *       Only PASSENGER role can submit reviews.
 *       Business rules:
 *       - Must have a confirmed booking for the trip
 *       - Trip must have already departed
 *       - Cannot review the same trip twice
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tripId
 *               - rating
 *             properties:
 *               tripId:
 *                 type: string
 *                 description: ID of the trip to review
 *                 example: 507f1f77bcf86cd799439011
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 description: Rating from 1 to 5 stars
 *                 example: 4
 *               comment:
 *                 type: string
 *                 maxLength: 500
 *                 description: Optional review comment
 *                 example: Great driver, very punctual!
 *     responses:
 *       201:
 *         description: Review submitted successfully
 *       400:
 *         description: Trip not completed yet or invalid rating
 *       403:
 *         description: Not a passenger or no booking for this trip
 *       404:
 *         description: Trip not found
 *       409:
 *         description: Already reviewed this trip
 */
router.post('/', authenticate, authorize('PASSENGER'), reviewController.createReview);

/**
 * @swagger
 * /api/reviews/my-reviews:
 *   get:
 *     summary: Get reviews written by the current user
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user's reviews
 *       401:
 *         description: Not authenticated
 */
router.get('/my-reviews', authenticate, reviewController.getMyReviews);

/**
 * @swagger
 * /api/reviews/driver/{driverId}:
 *   get:
 *     summary: Get reviews for a specific driver
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: driverId
 *         required: true
 *         schema:
 *           type: string
 *         description: Driver's user ID
 *     responses:
 *       200:
 *         description: List of driver reviews with average rating
 */
router.get('/driver/:driverId', reviewController.getDriverReviews);

module.exports = router;
