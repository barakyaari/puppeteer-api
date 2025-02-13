const express = require('express');
const bodyParser = require('body-parser');
require('dotenv').config();

const logger = require('./lib/logger'); // Import the logger
const { initiate, callback, refresh } = require('./lib/auth');
const researchByNameLogic = require('./lib/research');
const { getAutomatedMessages } = require('./lib/gptResponse');
const deleteConversationByContactId = require('./lib/deleteConversationByContactId');
const { sendWhatsAppMessage } = require('./lib/ghlMessageSender');

const app = express();
const port = process.env.PORT || 3000;

// Middleware to parse JSON bodies
app.use(bodyParser.json());

// OAuth routes
app.get('/initiate', initiate);
app.get('/oauth/callback', callback);
app.get('/refresh', refresh);

// Research by Name route
app.post('/researchByName', async (req, res) => {
    const { fullName } = req.body;

    if (!fullName || typeof fullName !== 'string') {
        logger.warn('Invalid input: fullName is required and must be a string.');
        return res.status(400).json({ error: 'Invalid input: fullName is required and must be a string.' });
    }

    try {
        logger.info(`Processing research for name: ${fullName}`);
        const researchResult = await researchByNameLogic(fullName);
        logger.info(`Research result for ${fullName}:`, researchResult);
        return res.json(researchResult);
    } catch (error) {
        logger.error('Error in /researchByName:', { message: error.message, stack: error.stack });
        return res.status(500).json({ error: 'Failed to process research by name', details: error.message });
    }
});

// Automated Messages endpoint
app.post('/getAutomatedMessages', async (req, res) => {
    try {
        logger.info('Request received for automated messages.');
        const response = await getAutomatedMessages(req, res);
        logger.info('Automated messages response:', response);
        return response;
    } catch (error) {
        logger.error('Error in /getAutomatedMessages:', { message: error.message, stack: error.stack });
        res.status(500).json({ error: 'Failed to get automated messages' });
    }
});

// Delete conversation by contact ID
app.delete('/deleteConversationByContactId/:contactId', async (req, res) => {
    try {
        logger.info(`Request received to delete conversations for contactId: ${req.params.contactId}`);

        // Pass req and res correctly
        await deleteConversationByContactId(req, res);

        logger.info(`Successfully deleted conversations for contactId: ${req.params.contactId}`);
        sendWhatsAppMessage('Conversation Deleted!', req.params.contactId);
    } catch (error) {
        logger.error('Error in /deleteConversationByContactId:', { message: error.message, stack: error.stack });
        res.status(500).json({ error: 'Failed to delete conversation' });
    }
});


// Basic health check endpoint
app.get('/', (req, res) => {
    logger.info('Health check endpoint accessed.');
    res.send('Welcome to the API!');
});

// Catch-all 404 handler for undefined routes
app.use((req, res) => {
    logger.warn(`404 - Endpoint not found: ${req.method} ${req.originalUrl}`);
    res.status(404).json({ error: 'Endpoint not found.' });
});

// Global error handler
app.use((err, req, res, next) => {
    logger.error('Global Error:', { message: err.message, stack: err.stack });
    res.status(500).json({ error: 'Internal server error.' });
});

// Start the server
app.listen(port, '0.0.0.0', () => {
    logger.info(`App listening on port ${port} (IPv4)!`);
});
