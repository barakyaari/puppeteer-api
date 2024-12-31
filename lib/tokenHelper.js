const fs = require('fs');
const path = require('path');
const axios = require('axios');
const logger = require('./logger'); // Import the logger

let cachedTokens = null; // Cache to hold in-memory tokens

// Save tokens to the local .env file
async function saveTokensToLocalFile(accessToken, refreshToken, expiresAt) {
    const envPath = path.join(__dirname, '../.env');

    try {
        // Only update tokens in the .env file if it's a valid environment
        if (process.env.NODE_ENV !== undefined && process.env.NODE_ENV !== '') {
            if (!fs.existsSync(envPath)) fs.writeFileSync(envPath, '');

            let currentEnv = fs.readFileSync(envPath, 'utf8');
            currentEnv = currentEnv
                .replace(/ACCESS_TOKEN=.*\n/, `ACCESS_TOKEN=${accessToken}\n`)
                .replace(/REFRESH_TOKEN=.*\n/, `REFRESH_TOKEN=${refreshToken}\n`)
                .replace(/EXPIRES_AT=.*\n/, `EXPIRES_AT=${expiresAt}\n`);

            // If the tokens are not found in the file, add them
            if (!currentEnv.includes('ACCESS_TOKEN=')) currentEnv += `ACCESS_TOKEN=${accessToken}\n`;
            if (!currentEnv.includes('REFRESH_TOKEN=')) currentEnv += `REFRESH_TOKEN=${refreshToken}\n`;
            if (!currentEnv.includes('EXPIRES_AT=')) currentEnv += `EXPIRES_AT=${expiresAt}\n`;

            fs.writeFileSync(envPath, currentEnv);
            logger.info('Tokens saved to local .env file', {
                accessToken,
                refreshToken,
                expiresAt,
            });
        } else {
            throw new Error('NODE_ENV is not set properly.');
        }
    } catch (error) {
        logger.error('Error updating .env file', { message: error.message, stack: error.stack });
        throw error;
    }
}

// Retrieve access token, refresh it if expired
async function getAccessToken() {
    const now = Date.now();
    const expiresAt = parseInt(process.env.EXPIRES_AT, 10);

    // If token is still valid, use the cached token
    if (cachedTokens && now < cachedTokens.expiresAt) {
        logger.info('Using cached access token');
        return cachedTokens.accessToken;
    }

    // If token has expired, refresh it
    if (now >= expiresAt) {
        logger.info('Access token expired, refreshing...');
        try {
            const response = await axios.post(
                'https://services.leadconnectorhq.com/oauth/token',
                new URLSearchParams({
                    client_id: process.env.CLIENT_ID,
                    client_secret: process.env.CLIENT_SECRET,
                    grant_type: 'refresh_token',
                    refresh_token: process.env.REFRESH_TOKEN,
                    user_type: 'Location',
                }),
                { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
            );

            const { access_token, refresh_token, expires_in } = response.data;
            const newExpiresAt = now + expires_in * 1000;
            await saveTokensToLocalFile(access_token, refresh_token, newExpiresAt);

            cachedTokens = { accessToken: access_token, expiresAt: newExpiresAt };
            logger.info('Access token refreshed successfully', {
                accessToken: access_token,
                refreshToken: refresh_token,
                expiresAt: newExpiresAt,
            });
            return access_token;
        } catch (error) {
            logger.error('Error refreshing access token', { message: error.message, stack: error.stack });
            throw new Error('Failed to refresh access token.');
        }
    }

    // Return the access token if it's still valid
    logger.info('Returning valid access token from environment');
    return process.env.ACCESS_TOKEN;
}

module.exports = { saveTokensToLocalFile, getAccessToken };
