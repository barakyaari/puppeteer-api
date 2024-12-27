const express = require('express');
const bodyParser = require('body-parser');
require('dotenv').config();

// Import the route handlers and logic from /lib
const { initiate, callback, refresh } = require('./lib/auth');  // Ensure these are functions
const researchByNameLogic = require('./lib/research');
const { getAutomatedMessages } = require('./lib/gptResponse');
const deleteConversationByContactId = require('./lib/deleteConversationByContactId');

const app = express();
const port = process.env.PORT || 3000;

// Middleware to parse JSON bodies
app.use(bodyParser.json());

// OAuth routes
app.get('/initiate', initiate);  // Pass function reference here
app.get('/oauth/callback', callback);  // Pass function reference here
app.get('/refresh', refresh);  // Pass function reference here

// Research by Name route
app.post('/researchByName', async (req, res) => {
    const { fullName } = req.body;

    if (!fullName || typeof fullName !== 'string') {
        return res.status(400).json({ error: 'Invalid input: fullName is required and must be a string.' });
    }

    try {
        const researchResult = await researchByNameLogic(fullName);
        return res.json(researchResult);
    } catch (error) {
        console.error('Error in /researchByName:', error.message);
        return res.status(500).json({ error: 'Failed to process research by name', details: error.message });
    }
});

// Automated Messages endpoint
app.post('/getAutomatedMessages', getAutomatedMessages);

// Delete conversation by contact ID
app.get('/deleteConversationByContactId/:contactId', deleteConversationByContactId);

// Basic health check endpoint
app.get('/', (req, res) => {
    res.send('Welcome to the API!');
});

// Catch-all 404 handler for undefined routes
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found.' });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Global Error:', err);
    res.status(500).json({ error: 'Internal server error.' });
});

// Start the server
app.listen(3000, '0.0.0.0', () => {
    console.log('App listening on port 3000 (IPv4)!');
});
