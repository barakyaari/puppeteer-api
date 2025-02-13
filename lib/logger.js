require('dotenv').config(); // Load .env file at the top

const { createLogger, format, transports } = require('winston');
const { LoggingWinston } = require('@google-cloud/logging-winston');

// Ensure credentials are loaded
if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  console.error("Missing GOOGLE_APPLICATION_CREDENTIALS in .env");
  process.exit(1); // Exit the process if credentials are missing
}

// Create the Google Cloud Logging transport
const loggingWinston = new LoggingWinston();

// Create the logger instance
const logger = createLogger({
  level: 'info', // Default log level
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.printf(({ timestamp, level, message, stack, ...meta }) => {
      // Ensure objects are properly expanded
      let metaString = Object.keys(meta).length ? ` ${JSON.stringify(meta, null, 2)}` : '';
      return stack
        ? `[${timestamp}] ${level}: ${message} - ${stack}${metaString}`
        : `[${timestamp}] ${level}: ${message}${metaString}`;
    })
  ),
  transports: [
    new transports.Console(), // Log to console
    loggingWinston // Log to Google Cloud Logging
  ]
});

module.exports = logger;
