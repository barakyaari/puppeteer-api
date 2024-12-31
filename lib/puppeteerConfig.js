const puppeteer = require('puppeteer');
const logger = require('./logger'); // Import the logger

async function launchPuppeteer() {
    const launchOptions = {
        headless: true,
        executablePath: process.env.CHROME_EXECUTABLE_PATH || '/usr/bin/google-chrome', // Update this path if necessary
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu',
        ],
    };

    try {
        logger.info('Launching Puppeteer...', { launchOptions });
        const browser = await puppeteer.launch(launchOptions);
        logger.info('Puppeteer launched successfully');
        return browser;
    } catch (error) {
        logger.error('Error launching Puppeteer', { message: error.message, stack: error.stack });
        throw error;
    }
}

module.exports = { launchPuppeteer };
