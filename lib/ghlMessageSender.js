const axios = require('axios');
const { getAccessToken } = require('./tokenHelper'); // Import getAccessToken from tokenHelper
const logger = require('./logger'); // Import the logger

// Replace with your GoHighLevel API URL for sending messages
const API_URL = 'https://services.leadconnectorhq.com/conversations/messages';

// Function to send a WhatsApp message through GoHighLevel
async function sendWhatsAppMessage(messageToSend, contactId) {
    try {
        // Make sure the required parameters are provided
        if (!messageToSend || !contactId) {
            logger.warn("Missing parameters", { messageToSend, contactId });
            throw new Error("Both 'messageToSend' and 'contactId' are required.");
        }

        // Get access token using the getAccessToken function
        const accessToken = await getAccessToken();
        logger.info('Access token retrieved successfully', { contactId });

        // Create the message payload
        const payload = {
            contactId: contactId, // The contactId
            message: messageToSend,  // The message content
            type: 'WhatsApp',      // WhatsApp source
        };

        // Set up the headers for the API request
        const headers = {
            Authorization: `Bearer ${accessToken}`,
            Version: '2021-04-15',
            'Content-Type': 'application/json',
        };

        // Send the request to GoHighLevel API
        const response = await axios.post(API_URL, payload, { headers });

        // Check if the message was sent successfully
        if (response.status === 201) {
            logger.info('Message sent successfully', { contactId, response: response.data });
            return response.data;
        } else {
            logger.error('Failed to send message', { status: response.status, contactId });
            throw new Error(`Failed to send message. Status code: ${response.status}`);
        }
    } catch (error) {
        logger.error('Error sending WhatsApp message', {
            contactId,
            message: error.message,
            stack: error.stack,
            response: error.response?.data,
        });
        throw new Error(`Failed to send WhatsApp message: ${error.message}`);
    }
}

module.exports = { sendWhatsAppMessage };
