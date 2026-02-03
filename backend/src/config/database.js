const mongoose = require('mongoose');

/**
 * Connect to MongoDB
 * Uses the connection string from environment variables
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

/**
 * Disconnect from MongoDB
 * Used for graceful shutdown and testing cleanup
 */
const disconnectDB = async () => {
  try {
    await mongoose.connection.close();
    console.log('MongoDB Disconnected');
  } catch (error) {
    console.error(`MongoDB Disconnection Error: ${error.message}`);
  }
};

module.exports = { connectDB, disconnectDB };
