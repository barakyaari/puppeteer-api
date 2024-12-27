const axios = require('axios');

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
            return response.data.choices[0].message.content.trim();
        }

        throw new Error('Unexpected GPT response format.');
    } catch (error) {
        console.error('Error communicating with GPT:', error.response?.data || error.message);
        throw new Error('Failed to fetch response from GPT.');
    }
};

module.exports = { askGPT };
