const { askGPT } = require('./chatGPT');
const axios = require('axios');
const { getContactById } = require('./getContactById');
const { getAppointmentsByContactId } = require('./getAppointmentsByContactId'); // NEW IMPORT
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
        logger.info('details:', { contactDetails });
        logger.info('contact Tags:', contactDetails.contact.tags)


        // ✅ Step 1: Fetch Messages for the Contact
        const messages = await getTextsByContactId(contactId);
        logger.info('Fetched messages for contact', { contactId });

        // ✅ Step 2: Fetch User's Appointments
        const appointments = await getAppointmentsByContactId(contactId);
        logger.info('Fetched appointments for contact', { contactId, totalAppointments: appointments.length });

        // ✅ Step 3: Fetch Instructions from Google Doc
        const instructions = await getGoogleDocContent(googleDocID);
        logger.info('Fetched instructions from Google Doc', { googleDocID });

        // ✅ Step 4: Query GPT Using Messages, Instructions, and Appointments
        const gptPrompt = `Message History:\n\n${messages}\n\nAppointments:\n\n${JSON.stringify(appointments, null, 2)}\n\nTags:\n\n${JSON.stringify(contactDetails.contact.tags, null, 2)}\n\nInstructions:\n\n${instructions}\n\n`;
        const gptResponse = await askGPT(gptPrompt);
        logger.info('GPT response received');

        // ✅ Step 4.1: Parse GPT Response into an Array
        let parsedMessages = [];
        try {
            parsedMessages = JSON.parse(gptResponse);
        } catch (parseError) {
            logger.error('Error parsing GPT response', { message: parseError.message });
            return res.status(500).json({ error: 'Failed to parse GPT response into array', details: parseError.message });
        }

        // ✅ Step 4.2: Ensure Response is an Array
        if (!Array.isArray(parsedMessages)) {
            logger.error('GPT response is not a valid array');
            return res.status(500).json({ error: 'GPT response is not a valid array' });
        }

        // ✅ Step 5: Send Messages via WhatsApp Asynchronously
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

        // ✅ Step 6: Send Final Response Once After Processing All Messages
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

module.exports = { getAutomatedMessages };
