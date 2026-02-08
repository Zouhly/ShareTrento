const { FavoriteSearch } = require('../models');

/**
 * Create a favorite search
 * POST /api/favorites
 * Protected: authenticated users
 */
const createFavorite = async (req, res, next) => {
  try {
    const { label, origin, destination, preferredTime } = req.body;

    if (!label || !origin || !destination) {
      return res.status(400).json({
        success: false,
        message: 'Please provide label, origin, and destination'
      });
    }

    const favorite = new FavoriteSearch({
      userId: req.user._id,
      label,
      origin,
      destination,
      preferredTime: preferredTime || undefined
    });

    await favorite.save();

    res.status(201).json({
      success: true,
      message: 'Favorite search saved',
      data: { favorite }
    });
  } catch (error) {
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'You already have a favorite with this origin and destination'
      });
    }
    next(error);
  }
};

/**
 * Get all favorites for the current user
 * GET /api/favorites
 * Protected: authenticated users
 */
const getMyFavorites = async (req, res, next) => {
  try {
    const favorites = await FavoriteSearch.find({ userId: req.user._id })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: favorites.length,
      data: { favorites }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a favorite search
 * DELETE /api/favorites/:id
 * Protected: authenticated users (own favorites only)
 */
const deleteFavorite = async (req, res, next) => {
  try {
    const favorite = await FavoriteSearch.findById(req.params.id);

    if (!favorite) {
      return res.status(404).json({
        success: false,
        message: 'Favorite not found'
      });
    }

    if (favorite.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own favorites'
      });
    }

    await FavoriteSearch.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Favorite deleted'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createFavorite,
  getMyFavorites,
  deleteFavorite
};
