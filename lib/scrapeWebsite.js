const { launchPuppeteer } = require('./puppeteerConfig');

/**
 * Scrape the content of a given website.
 * @param {string} url - The URL of the website to scrape.
 * @returns {Promise<string>} - The scraped website content.
 */
async function scrapeWebsite(url) {
    if (!url || typeof url !== 'string') {
        throw new Error('A valid URL must be provided.');
    }

    let browser;
    try {
        browser = await launchPuppeteer(); // Use the shared Puppeteer helper
        const page = await browser.newPage();

        await page.goto(url, { waitUntil: 'domcontentloaded' });

        const content = await page.evaluate(() => document.body.innerText || '');
        console.log('Scraped Content:', content.slice(0, 500)); // Log the first 500 characters
        return content;
    } catch (error) {
        console.error('Error in scrapeWebsite:', error);
        throw new Error('Failed to scrape website content.');
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

module.exports = scrapeWebsite;
