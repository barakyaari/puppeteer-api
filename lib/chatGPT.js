const axios = require('axios');
const logger = require('./logger'); // Import the logger

/**
 * Ask GPT for a response based on the provided prompt.
 * @param {string} prompt - The prompt to send to GPT.
 * @returns {Promise<string>} - The GPT response.
 */
const askGPT = async (prompt) => {
    try {
        const response = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
                model: 'gpt-4',
                messages: [{ role: 'user', content: prompt }],
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
                },
            }
        );

        if (response.data && response.data.choices && response.data.choices.length > 0) {
            const gptResponse = response.data.choices[0].message.content.trim();
            logger.info('GPT response received successfully.', { prompt, response: gptResponse });
            return gptResponse;
        }

        logger.error('Unexpected GPT response format.', { response: response.data });
        throw new Error('Unexpected GPT response format.');
    } catch (error) {
        logger.error('Error communicating with GPT.', {
            message: error.message,
            stack: error.stack,
            response: error.response?.data,
        });
        throw new Error('Failed to fetch response from GPT.');
    }
};

module.exports = { askGPT };
