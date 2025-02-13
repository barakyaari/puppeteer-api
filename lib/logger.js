require('dotenv').config(); // Load .env file at the top of the file

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
