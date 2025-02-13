const axios = require('axios');
const { getAccessToken } = require('./tokenHelper');
const logger = require('./logger');

/**
 * Function to fetch contact details by contactId.
 * @param {string} contactId - The ID of the contact.
 * @returns {Promise<Object>} - The contact details.
 */
async function getContactById(contactId) {
    if (!contactId) {
        logger.warn('Missing contactId in getContactById request.');
        throw new Error('Contact ID is required.');
    }

    try {
        // Step 1: Fetch the access token dynamically
        const accessToken = await getAccessToken();
        logger.info('Access token fetched successfully');

        // Step 2: Fetch contact details
        const contactUrl = `https://services.leadconnectorhq.com/contacts/${contactId}`;
        const response = await axios.get(contactUrl, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                Version: '2021-04-15',
            },
        });

        logger.info('Contact details fetched successfully', { contactId });
        return response.data; // Return the contact details
    } catch (error) {
        logger.error('Error fetching contact details', {
            contactId,
            message: error.message,
            response: error.response?.data,
        });
        throw new Error('Failed to fetch contact details.');
    }
}

module.exports = { getContactById };
