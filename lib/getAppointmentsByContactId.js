const axios = require('axios');
const { getAccessToken } = require('./tokenHelper');
const logger = require('./logger');

/**
 * Fetches user appointments by contact ID.
 * @param {string} contactId - The contact ID.
 * @returns {Promise<Array>} - Array of upcoming appointments.
 */
async function getAppointmentsByContactId(contactId) {
    if (!contactId) {
        logger.warn('Missing contactId in getAppointmentsByContactId request.');
        throw new Error('Contact ID is required.');
    }

    try {
        // ✅ Step 1: Fetch Access Token
        const accessToken = await getAccessToken();
        logger.info('Access token fetched successfully');

        // ✅ Step 2: Fetch Appointments
        const appointmentsUrl = `https://services.leadconnectorhq.com/contacts/${contactId}/appointments`;
        const response = await axios.get(appointmentsUrl, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                Version: '2021-07-28',
            },
        });

        logger.info(`Raw Appoinment API response: ${JSON.stringify(response.data, null, 2)}`);
        const appointments = response.data?.events || [];
        logger.info('Fetched appointments successfully', { contactId, totalAppointments: appointments.length });

        return appointments;
    } catch (error) {
        logger.error('Error fetching appointments', {
            contactId,
            message: error.message,
            response: error.response?.data,
        });
        throw new Error('Failed to fetch user appointments.');
    }
}

module.exports = { getAppointmentsByContactId };
