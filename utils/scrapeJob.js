const { launchPuppeteer } = require('../utils/puppeteerConfig');

module.exports = async (url) => {
    const browser = await launchPuppeteer();
    const page = await browser.newPage();

    try {
        console.log(`Scraping URL: ${url}`);
        await page.goto(url, { waitUntil: 'domcontentloaded' });
        const content = await page.content();
        return { url, content };
    } catch (error) {
        console.error('Error in scrape job:', error);
        throw error;
    } finally {
        await browser.close();
    }
};
