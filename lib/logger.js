const { createLogger, format, transports } = require('winston');
const { LoggingWinston } = require('@google-cloud/logging-winston');

// Create the Google Cloud Logging transport
const loggingWinston = new LoggingWinston();

// Create the logger instance
const logger = createLogger({
  level: 'info', // Default log level
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.printf(({ timestamp, level, message, stack }) => {
      return stack
        ? `[${timestamp}] ${level}: ${message} - ${stack}`
        : `[${timestamp}] ${level}: ${message}`;
    })
  ),
  transports: [
    new transports.Console(), // Log to console
    loggingWinston // Log to Google Cloud Logging
  ]
});

module.exports = logger;
