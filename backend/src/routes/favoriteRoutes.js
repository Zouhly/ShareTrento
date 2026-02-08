const express = require('express');
const router = express.Router();
const { favoriteController } = require('../controllers');
const { authenticate } = require('../middleware');

/**
 * @swagger
 * /api/favorites:
 *   get:
 *     summary: Get all favorite searches for the current user
 *     tags: [Favorites]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of saved favorite searches
 *       401:
 *         description: Not authenticated
 */
router.get('/', authenticate, favoriteController.getMyFavorites);

/**
 * @swagger
 * /api/favorites:
 *   post:
 *     summary: Save a new favorite search
 *     tags: [Favorites]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - label
 *               - origin
 *               - destination
 *             properties:
 *               label:
 *                 type: string
 *                 example: Daily commute
 *               origin:
 *                 type: string
 *                 example: Trento Centro
 *               destination:
 *                 type: string
 *                 example: Rovereto
 *               preferredTime:
 *                 type: string
 *                 example: "08:30"
 *                 description: Optional preferred departure time in HH:mm format
 *     responses:
 *       201:
 *         description: Favorite saved successfully
 *       401:
 *         description: Not authenticated
 *       409:
 *         description: Duplicate favorite
 */
router.post('/', authenticate, favoriteController.createFavorite);

/**
 * @swagger
 * /api/favorites/{id}:
 *   delete:
 *     summary: Delete a favorite search
 *     tags: [Favorites]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Favorite ID
 *     responses:
 *       200:
 *         description: Favorite deleted
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Favorite not found
 */
router.delete('/:id', authenticate, favoriteController.deleteFavorite);

module.exports = router;
