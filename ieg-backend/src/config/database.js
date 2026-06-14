const mongoose = require('mongoose');
const logger = require('../utils/logger');
const { getMongoUri, getMongoOptions } = require('./mongoUri');

const connectDB = async () => {
  const uri = getMongoUri();
  const options = getMongoOptions();

  try {
    const conn = await mongoose.connect(uri, options);
    logger.info(`MongoDB connected: ${conn.connection.host}`);
    logger.info(`Database: ${conn.connection.name}`);
  } catch (err) {
    logger.error(`MongoDB connection failed: ${err.message}`);
    process.exit(1);
  }

  mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB disconnected. Attempting reconnect...');
  });

  mongoose.connection.on('reconnected', () => {
    logger.info('MongoDB reconnected.');
  });
};

module.exports = connectDB;
