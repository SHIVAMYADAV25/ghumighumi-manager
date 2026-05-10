const http = require('http');
const app = require('./app');
const { connectDB } = require('./config/database');
const { initSocket } = require('./socket/socketManager');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();

  const server = http.createServer(app);
  initSocket(server);

  server.listen(PORT, () => {
    logger.info(`🚀 WanderSync API running on port ${PORT} [${process.env.NODE_ENV}]`);
  });

  // Graceful shutdown
  const gracefulShutdown = (signal) => {
    logger.info(`${signal} received. Shutting down gracefully...`);
    server.close(() => {
      logger.info('HTTP server closed');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  process.on('unhandledRejection', (err) => {
    logger.error('Unhandled Rejection:', err);
    server.close(() => process.exit(1));
  });
};

startServer();