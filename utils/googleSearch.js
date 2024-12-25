const { launchPuppeteer } = require('./puppeteerConfig');

/**
 * Perform a Google search for a query and retrieve the first page of results.
 * @param {string} query - The search query.
 * @returns {Promise<object[]>} - Array of search result objects.
 */
async function googleSearch(query) {
    console.log('Search Query:', query);

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
        throw new Error('Search query must be a non-empty string.');
    }

    let browser;
    try {
        browser = await launchPuppeteer(); // Use the shared Puppeteer helper
        const page = await browser.newPage();

        await page.setUserAgent(
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        );

        const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query.trim())}`;
        await page.goto(searchUrl, { waitUntil: 'domcontentloaded' });

        const cookieButtonSelector = 'button[aria-label="Accept all"]';
        if (await page.$(cookieButtonSelector)) {
            await page.click(cookieButtonSelector);
            await page.waitForTimeout(1000);
        }

        const searchResultsSelector = '#search';
        await page.waitForSelector(searchResultsSelector, { timeout: 15000 });

        const results = await page.evaluate(() => {
            const items = document.querySelectorAll('.tF2Cxc');
            return Array.from(items).map(item => ({
                title: item.querySelector('h3')?.innerText || 'No title',
                link: item.querySelector('a')?.href || 'No link',
                snippet: item.querySelector('.VwiC3b')?.innerText || 'No snippet',
            }));
        });

        console.log('Search Results:', results);
        return results;
    } catch (error) {
        console.error('Error in googleSearch:', error);
        throw new Error('Failed to retrieve search results.');
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

module.exports = googleSearch;
