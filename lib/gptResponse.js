const { askGPT } = require('./chatGPT');
const axios = require('axios');
const { getTextsByContactId } = require('./getTextsByContactId'); 
const { sendWhatsAppMessage } = require('./ghlMessageSender'); 

/**
 * Function to get automated messages based on the input.
 * @param {Array} messages - The array of messages that will be processed by GPT.
 * @param {string} instructions - The instructions to be used by GPT for analyzing the messages.
 * @returns {Promise<Array>} - The processed messages from GPT.
 */
async function getAutomatedMessages(req, res) {
    const { contactId, googleDocID } = req.body;

    if (!contactId || !googleDocID) {
        return res.status(400).json({ error: 'Invalid input: contactId and googleDocID are required.' });
    }

    try {
        // Step 1: Fetch messages for the contact
        const messages = await getTextsByContactId(contactId);
        console.log(`Fetched messages for contact: ${contactId}`);
        console.log(messages);

        // Step 2: Fetch instructions from the Google Doc
        const instructions = await getGoogleDocContent(googleDocID);
        console.log(`Fetched instructions from Google Doc: ${googleDocID}`);

        // Step 3: Query GPT using the messages and instructions
        const gptResponse = await queryGPT(messages, instructions);
        console.log('GPT Response:', gptResponse);

        // Parse GPT response into an actual array (if it comes as a string)
        let parsedMessages = [];
        try {
            parsedMessages = JSON.parse(gptResponse);  // Convert the string to an array
        } catch (parseError) {
            console.error('Error parsing GPT response:', parseError.message);
            return res.status(500).json({ error: 'Failed to parse GPT response into array', details: parseError.message });
        }

        // Ensure the response is an array of messages
        if (!Array.isArray(parsedMessages)) {
            return res.status(500).json({ error: 'GPT response is not a valid array', details: gptResponse });
        }

        // Step 4: Send each message in the GPT response to the user via WhatsApp with delay
        for (const message of parsedMessages) {
            try {
                const delay = message.split(' ').length * 600; // Calculate delay in milliseconds (0.3s per word)
                console.log(`Waiting ${delay} ms before sending the message...`);

                // Wait for the calculated delay before sending each message
                await new Promise(resolve => setTimeout(resolve, delay));

                // Send the message
                const result = await sendWhatsAppMessage(message, contactId);
                console.log('Sent message:', result);
            } catch (sendError) {
                console.error('Error sending message:', sendError.message);
            }
        }

        // Return GPT response as an array of messages
        return res.json({ messages: parsedMessages });
    } catch (error) {
        console.error('Error in /getAutomatedMessages:', error.message);
        return res.status(500).json({ error: 'Failed to process request.', details: error.message });
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
        console.error('Error fetching Google Doc content:', error.message);
        throw new Error('Failed to fetch Google Doc content.');
    }
}

/**
 * Function to query GPT using the provided messages and instructions.
 * @param {string} messages - The raw messages to process.
 * @param {string} instructions - Instructions to guide the GPT response.
 * @returns {Promise<string>} - The GPT response based on the input messages and instructions.
 */
async function queryGPT(messages, instructions) {
    const gptPrompt = `Given the following messages:\n\n${messages}\n\nAnd the following instructions:\n\n${instructions}\n\nProvide the best response based on the context.`;

    try {
        const gptResponse = await askGPT(gptPrompt);
        return gptResponse;
    } catch (error) {
        console.error('Error querying GPT:', error.message);
        throw new Error('Failed to query GPT.');
    }
}

module.exports = { getAutomatedMessages };
