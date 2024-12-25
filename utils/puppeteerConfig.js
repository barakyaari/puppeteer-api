const puppeteer = require('puppeteer');

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
        console.log('Launching Puppeteer...');
        const browser = await puppeteer.launch(launchOptions);
        return browser;
    } catch (error) {
        console.error('Error with launching Puppeteer:', error);
        throw error;
    }
}

module.exports = { launchPuppeteer };
