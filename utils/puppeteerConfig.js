const puppeteer = require('puppeteer');

async function launchPuppeteer() {
    const launchOptions = {
        headless: true,
        executablePath: '/usr/bin/google-chrome-stable',  // Path to the system-installed Chrome
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
