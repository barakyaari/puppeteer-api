const puppeteer = require('puppeteer');

exports.launchPuppeteer = async () => {
    const isProduction = process.env.NODE_ENV === 'production';

    const launchOptions = {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
        ],
        executablePath: isProduction ? process.env.CHROMIUM_PATH || '/usr/bin/google-chrome' : undefined,
    };

    try {
        console.log('Launching Puppeteer...');
        return await puppeteer.launch(launchOptions);
    } catch (error) {
        console.error('Error launching Puppeteer:', error);
        throw error;
    }
};
