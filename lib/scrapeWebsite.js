const { launchPuppeteer } = require('./puppeteerConfig');
const logger = require('./logger'); // Import the logger

/**
 * Scrape the content of a given website.
 * @param {string} url - The URL of the website to scrape.
 * @returns {Promise<string>} - The scraped website content.
 */
async function scrapeWebsite(url) {
    if (!url || typeof url !== 'string') {
        logger.warn('Invalid URL provided', { url });
        throw new Error('A valid URL must be provided.');
    }

    let browser;
    try {
        logger.info('Launching Puppeteer for website scraping', { url });
        browser = await launchPuppeteer(); // Use the shared Puppeteer helper
        const page = await browser.newPage();

        logger.info('Navigating to the URL', { url });
        await page.goto(url, { waitUntil: 'domcontentloaded' });

        const content = await page.evaluate(() => document.body.innerText || '');
        logger.info('Website content scraped successfully', { url, snippet: content.slice(0, 500) }); // Log first 500 characters
        return content;
    } catch (error) {
        logger.error('Error in scrapeWebsite', { url, message: error.message, stack: error.stack });
        throw new Error('Failed to scrape website content.');
    } finally {
        if (browser) {
            await browser.close();
            logger.info('Browser closed after scraping', { url });
        }
    }
}

module.exports = scrapeWebsite;
