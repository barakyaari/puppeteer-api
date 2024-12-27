// lib/deleteConversationByContactId.js
const axios = require('axios');
const { getAccessToken } = require('./tokenHelper');

async function deleteConversationsByContact(req, res) {
    const { contactId } = req.params;

    console.log(`Request received to delete conversations for contact ID: ${contactId}`);

    try {
        // Step 1: Fetch the access token dynamically
        const accessToken = await getAccessToken();
        console.log('Access token fetched successfully:', accessToken);

        // Step 2: Search for conversations by contactId
        const searchUrl = `https://services.leadconnectorhq.com/conversations/search`;
        const searchResponse = await axios.get(searchUrl, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                Version: '2021-04-15',
            },
            params: { contactId },
        });

        console.log('Search response:', searchResponse.data);

        const conversations = searchResponse.data.conversations;

        if (!conversations || conversations.length === 0) {
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
            console.log(`Deleted conversation with ID: ${conversation.id}`);
        });

        // Wait for all deletions to complete
        await Promise.all(deletePromises);

        // Step 4: Respond with success
        return res.status(200).json({
            message: `${conversations.length} conversation(s) deleted successfully for contact ID: ${contactId}.`,
        });
    } catch (error) {
        console.error('Error deleting conversations:', error.response?.data || error.message);
        return res.status(500).json({
            error: 'Failed to delete conversations',
            details: error.response?.data || error.message,
        });
    }
}

module.exports = deleteConversationsByContact;
