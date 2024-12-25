const scrapeJob = require('../jobs/scrapeJob');

exports.scrape = async (req, res) => {
    const { url } = req.body;

    if (!url) {
        return res.status(400).json({ error: 'URL is required.' });
    }

    try {
        const data = await scrapeJob(url);
        res.json({ success: true, data });
    } catch (error) {
        console.error('Error in scrape controller:', error);
        res.status(500).json({ error: 'Failed to perform scraping.' });
    }
};
