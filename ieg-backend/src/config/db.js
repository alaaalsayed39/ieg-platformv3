// MongoDB connection with retry logic and event listeners

const mongoose = require('mongoose');
const { env } = require('./env');
const logger = require('../utils/logger');

const RETRY_INTERVAL = 5000;
const MAX_RETRIES = 5;

let retries = 0;

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(env.mongoUri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    logger.info(`✅ MongoDB connected: ${conn.connection.host}`);
    retries = 0;
  } catch (error) {
    retries++;
    logger.error(`❌ MongoDB connection failed (attempt ${retries}/${MAX_RETRIES}): ${error.message}`);

    if (retries < MAX_RETRIES) {
      logger.info(`🔄 Retrying in ${RETRY_INTERVAL / 1000}s...`);
      setTimeout(connectDB, RETRY_INTERVAL);
    } else {
      logger.error('💀 Max retries reached. Exiting.');
      process.exit(1);
    }
  }
};

// Connection event listeners
mongoose.connection.on('disconnected', () => {
  logger.warn('⚠️ MongoDB disconnected. Attempting to reconnect...');
  connectDB();
});

mongoose.connection.on('error', (err) => {
  logger.error(`MongoDB error: ${err.message}`);
});

mongoose.connection.on('reconnected', () => {
  logger.info('✅ MongoDB reconnected');
});

module.exports = connectDB;
