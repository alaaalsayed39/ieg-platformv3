require('dotenv').config();
const http = require('http');
const app = require('./app');
const connectDB = require('./config/database');
const logger = require('./utils/logger');
const socketService = require('./sockets/socket');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

    const server = http.createServer(app);
    socketService.init(server);

    server.listen(PORT, () => {
      logger.info('═══════════════════════════════════════════════');
      logger.info('  IEG — International Export Gateway API');
      logger.info(`  Environment : ${process.env.NODE_ENV || 'development'}`);
      logger.info(`  Port        : ${PORT}`);
      logger.info(`  Base URL    : http://localhost:${PORT}/api/v1`);
      logger.info(`  Health      : http://localhost:${PORT}/health`);
      logger.info('═══════════════════════════════════════════════');
    });

    const shutdown = (signal) => {
      logger.warn(`${signal} received. Shutting down gracefully...`);
      require('mongoose').connection.close(false, () => process.exit(0));
    };
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    const paymentService = require('./modules/payments/payment.service');
    setInterval(() => {
      paymentService.processAutoConfirmations().catch(() => {});
    }, 60 * 60 * 1000);
  } catch (err) {
    logger.error(`Failed to start server: ${err.message}`);
    process.exit(1);
  }
};

startServer();
