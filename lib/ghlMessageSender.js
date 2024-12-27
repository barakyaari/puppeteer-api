const axios = require('axios');
const { getAccessToken } = require('./tokenHelper'); // Import getAccessToken from tokenHelper

// Replace with your GoHighLevel API URL for sending messages
const API_URL = 'https://services.leadconnectorhq.com/conversations/messages';

// Function to send a WhatsApp message through GoHighLevel
async function sendWhatsAppMessage(messageToSend, contactId) {
    try {
        // Make sure the required parameters are provided
        if (!messageToSend || !contactId) {
            throw new Error("Both 'messageToSend' and 'contactId' are required.");
        }

        // Get access token using the getAccessToken function
        const accessToken = await getAccessToken();
        console.log('Access Token:', accessToken);

        // Create the message payload
        const payload = {
            contactId: contactId, // The contactId
            message: messageToSend,  // The message content
            'type': 'WhatsApp',      // WhatsApp source
        };

        // Set up the headers for the API request
        const headers = {
            'Authorization': `Bearer ${accessToken}`,
            Version: '2021-04-15',
            'Content-Type': 'application/json',
        };

        // Send the request to GoHighLevel API
        const response = await axios.post(API_URL, payload, { headers });

        // Check if the message was sent successfully
        if (response.status === 201) {
            console.log('Message sent successfully:', response.data);
            return response.data;
        } else {
            throw new Error(`Failed to send message. Status code: ${response.status}`);
        }
    } catch (error) {
        console.error('Error sending WhatsApp message:', error.message);
        throw new Error(`Failed to send WhatsApp message: ${error.message}`);
    }
}

module.exports = { sendWhatsAppMessage };
