const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const googleSearch = require('./utils/googleSearch');
const scrapeWebsite = require('./utils/scrapeWebsite');

// Create a logs directory if it doesn't exist
const logDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
}

// Create a write stream for logging
const logStream = fs.createWriteStream(path.join(logDir, 'app.log'), { flags: 'a' });

// Function to log messages to both console and file
const log = (message) => {
    const timestamp = new Date().toISOString();
    const logMessage = `${timestamp} - ${message}`;
    console.log(logMessage);
    logStream.write(logMessage + '\n');
};

const app = express();
const port = process.env.PORT || 3000;

// Middleware to parse JSON bodies
app.use(bodyParser.json());

// Endpoint for Google search
app.post('/searchGoogle', async (req, res) => {
    const { query } = req.body;

    if (!query) {
        log('Error: Query is required');
        return res.status(400).json({ error: 'Query is required' });
    }

    try {
        log(`Performing Google search for query: ${query}`);
        const results = await googleSearch(query);
        log(`Successfully fetched ${results.length} results`);
        return res.json(results);
    } catch (error) {
        log(`Error in /searchGoogle: ${error.message}`);
        return res.status(500).json({ error: 'Failed to perform Google search' });
    }
});

// Endpoint for scraping website content
app.post('/getWebsiteContent', async (req, res) => {
    const { url } = req.body;

    if (!url) {
        log('Error: URL is required');
        return res.status(400).json({ error: 'URL is required' });
    }

    try {
        log(`Scraping website content for URL: ${url}`);
        const content = await scrapeWebsite(url);
        log(`Successfully scraped content from ${url}`);
        return res.json({ content });
    } catch (error) {
        log(`Error in /getWebsiteContent: ${error.message}`);
        return res.status(500).json({ error: 'Failed to scrape website content' });
    }
});

// Basic health check endpoint
app.get('/', (req, res) => {
    log('Received a request to the root endpoint');
    res.send('Welcome to the API!');
});

// Handle all uncaught exceptions
process.on('uncaughtException', (error) => {
    log(`Uncaught Exception: ${error.message}`);
    process.exit(1); // Exit the process after logging the error
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (error) => {
    log(`Unhandled Rejection: ${error.message}`);
    process.exit(1); // Exit the process after logging the error
});

// Start the server
app.listen(port, '0.0.0.0', () => {
    console.log(`Server is running on port ${port}`);
});

