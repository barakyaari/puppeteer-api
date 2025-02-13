// lib/deleteConversationByContactId.js
const axios = require('axios');
const { getAccessToken } = require('./tokenHelper');
const logger = require('./logger'); // Import the logger

async function deleteConversationsByContactId(req, res) {
    // Debugging logs
    logger.info('Received request:', { method: req.method, url: req.url, params: req.params, query: req.query, body: req.body });

    // Ensure contactId is extracted properly
    const contactId = req.params?.contactId || req.query?.contactId;

    if (!contactId) {
        logger.error('Missing contactId in request', { params: req.params, query: req.query });
        return res.status(400).json({ error: 'Missing contactId parameter in request URL' });
    }

    logger.info('Request received to delete conversations for contact ID', { contactId });

    try {
        // Step 1: Fetch the access token dynamically
        const accessToken = await getAccessToken();
        logger.info('Access token fetched successfully');

        // Step 2: Search for conversations by contactId
        const searchUrl = `https://services.leadconnectorhq.com/conversations/search`;
        const searchResponse = await axios.get(searchUrl, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                Version: '2021-04-15',
            },
            params: { contactId },
        });

        logger.info('Search response received', { data: searchResponse.data });

        const conversations = searchResponse.data.conversations;

        if (!conversations || conversations.length === 0) {
            logger.warn('No conversations found for contact ID', { contactId });
            return res.status(404).json({
                message: `No conversations found for contact ID: ${contactId}`,
            });
        }

        // Step 3: Delete all conversations associated with the contactId
        const deletePromises = conversations.map(async (conversation) => {
            const deleteUrl = `https://services.leadconnectorhq.com/conversations/${conversation.id}`;
            await axios.delete(deleteUrl, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    Version: '2021-04-15',
                },
            });
            logger.info('Deleted conversation', { conversationId: conversation.id });
        });

        // Wait for all deletions to complete
        await Promise.all(deletePromises);

        // Step 4: Respond with success
        logger.info('Conversations deleted successfully', { contactId, count: conversations.length });
        return res.status(200).json({
            message: `${conversations.length} conversation(s) deleted successfully for contact ID: ${contactId}.`,
        });
    } catch (error) {
        logger.error('Error deleting conversations', {
            message: error.message,
            stack: error.stack,
            response: error.response?.data,
        });
        return res.status(500).json({
            error: 'Failed to delete conversations',
            details: error.response?.data || error.message,
        });
    }
}

// Ensure correct export
module.exports = deleteConversationsByContactId;
