const googleSearch = require('./googleSearch');
const scrapeWebsite = require('./scrapeWebsite');

/**
 * Perform Google search and optionally scrape the given website.
 * @param {string} query - The search query.
 * @param {string|null} website - Website URL (optional).
 * @returns {Promise<object>} - Combined results from Google search and website scrape.
 */
const googleSearchAndScrape = async (query, website = null) => {
    if (!query || typeof query !== 'string') {
        throw new Error('Search query must be a non-empty string.');
    }

    let searchResults = [];
    let websiteContent = null;

    try {
        console.log('Performing Google search for query:', query);
        searchResults = await googleSearch(query);

        if (website && typeof website === 'string') {
            console.log('Scraping website:', website);
            websiteContent = await scrapeWebsite(website);
        }
    } catch (error) {
        console.error('Error in googleSearchAndScrape:', error);
        throw new Error('Failed to perform Google search and scrape.');
    }

    return { searchResults, websiteContent };
};

module.exports = googleSearchAndScrape;
