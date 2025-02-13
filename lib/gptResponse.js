const { askGPT } = require('./chatGPT');
const axios = require('axios');
const { getContactById } = require('./getContactById');
const { getTextsByContactId } = require('./getTextsByContactId');
const { sendWhatsAppMessage } = require('./ghlMessageSender');
const logger = require('./logger');
const util = require('util'); // Import util to safely log objects

/**
 * Function to get automated messages based on the input.
 * @param {Array} messages - The array of messages that will be processed by GPT.
 * @param {string} instructions - The instructions to be used by GPT for analyzing the messages.
 * @returns {Promise<Array>} - The processed messages from GPT.
 */
async function getAutomatedMessages(req, res) {
    const { contactId, googleDocID } = req.body;

    if (!contactId || !googleDocID) {
        logger.warn('Invalid input received', { contactId, googleDocID });
        return res.status(400).json({ error: 'Invalid input: contactId and googleDocID are required.' });
    }

    try {
        // ✅ Step 0: Fetch Contact Details
        const contactDetails = await getContactById(contactId);
        logger.info('Fetched contact details successfully', { contactId });

        // ✅ Step 1: Fetch messages for the contact
        const messages = await getTextsByContactId(contactId);
        logger.info('Fetched messages for contact', { contactId });

        // ✅ Step 2: Fetch instructions from the Google Doc
        const instructions = await getGoogleDocContent(googleDocID);
        logger.info('Fetched instructions from Google Doc', { googleDocID });

        // ✅ Step 3: Query GPT using the messages and instructions
        const gptResponse = await queryGPT(messages, instructions);
        logger.info('GPT response received');

        // ✅ Step 3.1: Parse GPT response into an array
        let parsedMessages = [];
        try {
            parsedMessages = JSON.parse(gptResponse); // Convert the string to an array
        } catch (parseError) {
            logger.error('Error parsing GPT response', { message: parseError.message });
            return res.status(500).json({ error: 'Failed to parse GPT response into array', details: parseError.message });
        }

        // ✅ Step 3.2: Ensure the response is an array of messages
        if (!Array.isArray(parsedMessages)) {
            logger.error('GPT response is not a valid array');
            return res.status(500).json({ error: 'GPT response is not a valid array' });
        }

        // ✅ Step 4: Send messages via WhatsApp asynchronously
        for (const message of parsedMessages) {
            try {
                const delay = message.split(' ').length * 600; // Calculate delay (0.6s per word)
                logger.info('Calculated delay before sending message', { delay });

                // Wait for the calculated delay before sending each message
                await new Promise(resolve => setTimeout(resolve, delay));

                // Send the message
                const result = await sendWhatsAppMessage(message, contactId);
                logger.info(`Sent message: "${message}"`, { contactId, messageId: result.messageId });
            } catch (sendError) {
                logger.error('Error sending message', { message, contactId, error: sendError.message });
            }
        }

        // ✅ Step 5: Send final response once after processing all messages
        if (!res.headersSent) {
            logger.info('All messages processed successfully', { contactId });
            return res.json({ messages: parsedMessages });
        }

    } catch (error) {
        logger.error('Error in /getAutomatedMessages', { message: error.message });

        if (!res.headersSent) {
            return res.status(500).json({ error: 'Failed to process request.', details: error.message });
        }
    }
}

/**
 * Function to get content from a Google Doc based on its ID.
 * @param {string} googleDocID - The ID of the Google Doc.
 * @returns {Promise<string>} - The content of the Google Doc.
 */
async function getGoogleDocContent(googleDocID) {
    try {
        const response = await axios.get(`https://docs.google.com/document/d/${googleDocID}/export?format=txt`);
        return response.data;
    } catch (error) {
        logger.error('Error fetching Google Doc content', { googleDocID });
        throw new Error('Failed to fetch Google Doc content.');
    }
}

/**
 * Function to query GPT using the provided messages and instructions.
 * @returns {Promise<string>} - The GPT response based on the input messages and instructions.
 */
async function queryGPT(messages, instructions) {
    const gptPrompt = `Message History:\n\n${messages}\n\nInstructions:\n\n${instructions}\n\n`;
    try {
        return await askGPT(gptPrompt);
    } catch (error) {
        logger.error('Error querying GPT', { message: error.message });
        throw new Error('Failed to query GPT.');
    }
}

module.exports = { getAutomatedMessages };
