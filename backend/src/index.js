require('dotenv').config();

const createApp = require('./app');
const { connectDB } = require('./config/database');

const PORT = process.env.PORT || 3000;

/**
 * Start the server
 */
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Create Express app
    const app = createApp();

    // Start listening
    app.listen(PORT, () => {
      console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   🚗  ShareTrento API Server                               ║
║                                                            ║
║   Server running on: http://localhost:${PORT}                 ║
║   API Documentation: http://localhost:${PORT}/api-docs        ║
║   Health Check:      http://localhost:${PORT}/health          ║
║                                                            ║
║   Environment: ${process.env.NODE_ENV || 'development'}                              ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  process.exit(1);
});

startServer();
