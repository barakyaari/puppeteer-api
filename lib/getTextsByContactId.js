const axios = require('axios');
const { getAccessToken } = require('./tokenHelper');

/**
 * Function to get texts by contact ID.
 * @param {string} contactId - The contact ID whose messages will be fetched.
 * @returns {Promise<string>} - A promise that resolves to the formatted messages.
 */
async function getTextsByContactId(contactId) {
    try {
        // Step 1: Fetch the access token dynamically
        const accessToken = await getAccessToken();

        // Step 2: Search for conversations by contactId
        const searchUrl = `https://services.leadconnectorhq.com/conversations/search`;
        const searchResponse = await axios.get(searchUrl, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                Version: '2021-04-15',
            },
            params: { contactId },
        });

        const conversations = searchResponse.data.conversations;

        if (!conversations || conversations.length === 0) {
            return { messages: "No messages found." };
        }

        // Step 3: Fetch all messages for the first conversation ID
        const conversationId = conversations[0].id;
        let allMessages = [];
        let lastMessageId = null;
        let hasNextPage = true;

        while (hasNextPage) {
            const messagesUrl = `https://services.leadconnectorhq.com/conversations/${conversationId}/messages`;
            const messagesResponse = await axios.get(messagesUrl, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    Version: '2021-04-15',
                },
                params: lastMessageId ? { lastMessageId } : {},
            });

            const { messages = [], nextPage: pageHasNext, lastMessageId: newLastMessageId } =
                messagesResponse.data.messages || {};

            if (Array.isArray(messages)) {
                allMessages = allMessages.concat(messages);
            }
            lastMessageId = newLastMessageId || null;
            hasNextPage = pageHasNext;
        }

        // Step 4: Filter only WhatsApp messages and sort properly by dateAdded
        const filteredMessages = allMessages
            .filter((msg) => msg.messageType && msg.messageType.toUpperCase() === 'TYPE_WHATSAPP')
            .sort((a, b) => new Date(a.dateAdded || 0) - new Date(b.dateAdded || 0));

        if (filteredMessages.length === 0) {
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

        return  formattedMessages.trim() ;
    } catch (error) {
        console.error('Error fetching texts by contact ID:', error.response?.data || error.message);
        throw new Error('Failed to fetch texts by contact ID: ' + (error.response?.data || error.message));
    }
}

module.exports = { getTextsByContactId };
