const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');

const { authRoutes, tripRoutes, bookingRoutes, reviewRoutes } = require('./routes');
const { errorHandler, notFound } = require('./middleware');
const swaggerSpec = require('./config/swagger');

/**
 * Create and configure Express application
 * Exported separately for testing purposes
 */
const createApp = () => {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());

  // API Documentation
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'ShareTrento API Documentation'
  }));

  // Serve OpenAPI spec as JSON
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.status(200).json({
      success: true,
      message: 'ShareTrento API is running',
      timestamp: new Date().toISOString()
    });
  });

  // API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/trips', tripRoutes);
  app.use('/api/bookings', bookingRoutes);
  app.use('/api/reviews', reviewRoutes);

  // Error handling
  app.use(notFound);
  app.use(errorHandler);

  return app;
};

module.exports = createApp;
