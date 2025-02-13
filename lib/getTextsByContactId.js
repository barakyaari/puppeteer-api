const axios = require('axios');
const { getAccessToken } = require('./tokenHelper');
const logger = require('./logger'); // Import the logger

/**
 * Function to get texts by contact ID.
 * @param {string} contactId - The contact ID whose messages will be fetched.
 * @returns {Promise<string>} - A promise that resolves to the formatted messages.
 */
async function getTextsByContactId(contactId) {
    try {
        logger.info('Fetching texts for contact ID', { contactId });

        // Step 1: Fetch the access token dynamically
        const accessToken = await getAccessToken();
        if (!accessToken) {
            throw new Error('Access token is missing or invalid.');
        }
        logger.info('Access token fetched successfully', { contactId });

        // Step 2: Search for conversations by contactId
        const searchUrl = `https://services.leadconnectorhq.com/conversations/search`;

        let searchResponse;
        try {
            searchResponse = await axios.get(searchUrl, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    Version: '2021-04-15',
                },
                params: { contactId },
            });
        } catch (error) {
            logger.error('Error searching conversations', {
                contactId,
                message: error.message,
                response: error.response?.data || 'No response from API',
                stack: error.stack,
            });
            throw new Error('Failed to search conversations: ' + (error.response?.data || error.message));
        }

        logger.info('Conversations search response received', { contactId, data: searchResponse.data });

        const conversations = searchResponse.data.conversations;
        if (!Array.isArray(conversations) || conversations.length === 0) {
            logger.warn('No conversations found for contact ID', { contactId });
            return { messages: "No messages found." };
        }

        // Step 3: Fetch all messages for the first conversation ID
        const conversationId = conversations[0].id;
        let allMessages = [];
        let lastMessageId = null;
        let hasNextPage = true;

        while (hasNextPage) {
            const messagesUrl = `https://services.leadconnectorhq.com/conversations/${conversationId}/messages`;

            let messagesResponse;
            try {
                messagesResponse = await axios.get(messagesUrl, {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        Version: '2021-04-15',
                    },
                    params: lastMessageId ? { lastMessageId } : {},
                });
            } catch (error) {
                logger.error('Error fetching messages', {
                    contactId,
                    conversationId,
                    message: error.message,
                    response: error.response?.data || 'No response from API',
                    stack: error.stack,
                });
                throw new Error('Failed to fetch messages: ' + (error.response?.data || error.message));
            }

            if (!messagesResponse.data || !messagesResponse.data.messages) {
                logger.warn('Unexpected API response format', { contactId, conversationId, response: messagesResponse.data });
                break;
            }

            const { messages = [], nextPage: pageHasNext, lastMessageId: newLastMessageId } = messagesResponse.data.messages || {};

            if (Array.isArray(messages)) {
                allMessages = allMessages.concat(messages);
            }

            lastMessageId = newLastMessageId || null;
            hasNextPage = !!pageHasNext;
        }

        logger.info('Messages fetched successfully', { contactId, messageCount: allMessages.length });

        // Step 4: Filter only WhatsApp messages and sort properly by dateAdded
        const filteredMessages = allMessages
            .filter((msg) => msg.messageType?.toUpperCase() === 'TYPE_WHATSAPP')
            .sort((a, b) => new Date(a.dateAdded || 0) - new Date(b.dateAdded || 0));

        if (filteredMessages.length === 0) {
            logger.warn('No WhatsApp messages found for contact ID', { contactId });
            return { messages: "No WhatsApp messages found." };
        }

        // Step 5: Format messages (first to last)
        let formattedMessages = '';
        let userMessage = null;

        for (const message of filteredMessages) {
            if (message.direction === 'inbound') {
                userMessage = message.body; // User message
            } else if (message.direction === 'outbound') {
                if (userMessage) {
                    formattedMessages += `User: ${userMessage}\nAgent: ${message.body}\n`;
                    userMessage = null; // Reset user message
                } else {
                    formattedMessages += `Agent: ${message.body}\n`;
                }
            }
        }

        if (userMessage) {
            formattedMessages += `User: ${userMessage}\n`;
        }

        logger.info('Messages formatted successfully', { contactId });
        return formattedMessages.trim();
    } catch (error) {
        logger.error('Critical error in getTextsByContactId', {
            contactId,
            message: error.message,
            stack: error.stack,
            response: error.response?.data || 'No response from API',
        });
        throw new Error('Failed to fetch texts by contact ID: ' + (error.response?.data || error.message));
    }
}

module.exports = { getTextsByContactId };
