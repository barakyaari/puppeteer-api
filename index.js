// index.js

const express = require('express');
const bodyParser = require('body-parser');
const googleSearch = require('./utils/googleSearch');
const scrapeWebsite = require('./utils/scrapeWebsite');

const app = express();
const port = process.env.PORT || 3000;

// Middleware to parse JSON bodies
app.use(bodyParser.json());

// Endpoint for Google search
app.post('/searchGoogle', async (req, res) => {
    const { query } = req.body;

    if (!query) {
        return res.status(400).json({ error: 'Query is required' });
    }

    try {
        const results = await googleSearch(query);
        return res.json(results);
    } catch (error) {
        console.error('Error in /searchGoogle:', error);
        return res.status(500).json({ error: 'Failed to perform Google search' });
    }
});

// Endpoint for scraping website content
app.post('/getWebsiteContent', async (req, res) => {
    const { url } = req.body;

    if (!url) {
        return res.status(400).json({ error: 'URL is required' });
    }

    try {
        const content = await scrapeWebsite(url);
        return res.json({ content });
    } catch (error) {
        console.error('Error in /getWebsiteContent:', error);
        return res.status(500).json({ error: 'Failed to scrape website content' });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
