const fs = require('fs');
const path = require('path');
const axios = require('axios');
const qs = require('qs');
const { saveTokensToLocalFile, getAccessToken } = require('./tokenHelper');
const logger = require('./logger'); // Import the logger

// OAuth initiate function
async function initiate(req, res) {
    const options = {
        responseType: 'code',
        redirectUri: process.env.REDIRECT_URI,
        clientId: process.env.CLIENT_ID,
        scopes: [
            'conversations/message.readonly',
            'conversations/message.write',
            'contacts.readonly',
            'conversations.readonly',
            'conversations.write',
        ],
    };

    logger.info('Initiating OAuth process', {
        base_url: process.env.BASE_URL,
        redirect_uri: process.env.REDIRECT_URI,
        client_id: process.env.CLIENT_ID,
    });

    return res.redirect(
        `${process.env.BASE_URL}/oauth/chooselocation?response_type=${encodeURIComponent(options.responseType)}&redirect_uri=${encodeURIComponent(options.redirectUri)}&client_id=${options.clientId}&scope=${encodeURIComponent(options.scopes.join(' '))}`
    );
}

// OAuth callback function
async function callback(req, res) {
    try {
        const { code } = req.query;
        logger.info('Received OAuth callback with authorization code', { code });

        const data = qs.stringify({
            client_id: process.env.CLIENT_ID,
            client_secret: process.env.CLIENT_SECRET,
            grant_type: 'authorization_code',
            code: code,
            user_type: 'Location',
            redirect_uri: process.env.REDIRECT_URI,
        });

        const response = await axios.post('https://services.leadconnectorhq.com/oauth/token', data, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        });

        const { access_token, refresh_token, expires_in } = response.data;

        // Save token to file
        await saveTokensToLocalFile(access_token, refresh_token, Date.now() + expires_in * 1000);

        // Update process.env with the new access token
        process.env.ACCESS_TOKEN = access_token;

        logger.info('Tokens saved successfully', { access_token, refresh_token });
        return res.json({ message: 'Tokens saved successfully' });
    } catch (err) {
        logger.error('Error during OAuth callback', { message: err.message, stack: err.stack });
        return res.status(500).json({ error: 'Failed to save tokens' });
    }
}

// Refresh access token
async function refresh(req, res) {
    try {
        const accessToken = await getAccessToken();

        // Update process.env with the refreshed access token
        process.env.ACCESS_TOKEN = accessToken;

        logger.info('Access token refreshed successfully', { access_token: accessToken });
        return res.json({ message: 'Token refreshed and valid', access_token: accessToken });
    } catch (err) {
        logger.error('Error refreshing access token', { message: err.message, stack: err.stack });
        return res.status(500).json({ error: 'Failed to refresh access token' });
    }
}

module.exports = { initiate, callback, refresh };
