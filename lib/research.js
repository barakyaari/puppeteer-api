const { askGPT } = require('./chatGPT');
const googleSearch = require('./googleSearch');
const scrapeWebsite = require('./scrapeWebsite');
const logger = require('./logger'); // Import the logger

// Function to clean and parse the GPT response
const cleanJsonResponse = (response) => {
    try {
        const jsonResponse = response.trim();

        // Handle JSON inside triple backticks (e.g., ```json ...```)
        const jsonMatch = jsonResponse.match(/```json([\s\S]*?)```/);
        if (jsonMatch && jsonMatch.length >= 2) {
            const jsonString = jsonMatch[1].trim();
            return JSON.parse(jsonString);
        }

        // Directly parse if it's valid JSON (without needing backticks)
        if (jsonResponse.startsWith("{") && jsonResponse.endsWith("}")) {
            return JSON.parse(jsonResponse);
        }

        // If it's not a valid JSON, log and throw an error
        throw new Error('Invalid JSON format in GPT response');
    } catch (error) {
        logger.error('Failed to parse GPT response', { response, error: error.message });
        throw new Error('Invalid GPT inference response format.');
    }
};

// Function to infer details using GPT
const inferDetailsUsingGPT = async (fullName) => {
    const gptPrompt = `Given the name "${fullName}", provide a strict JSON response with the following fields:
    {
        "name": "<Full Name>",
        "company": "<Company Name or null>",
        "website": "<Website URL or null>",
        "type": "<Type of profession, e.g., 'Business Coach' or 'Therapist'>",
        "isCoachOrTherapist": "<Yes or No>"
    }

    Always output only a JSON block. Do not include explanations or additional text.`;

    try {
        logger.info('Sending GPT prompt for inference', { fullName });
        const rawGPTResponse = await askGPT(gptPrompt);
        logger.info('Raw GPT response received', { rawGPTResponse });
        return cleanJsonResponse(rawGPTResponse);
    } catch (error) {
        logger.error('Error during GPT inference', { fullName, error: error.message });
        throw new Error('Failed to infer details using GPT.');
    }
};

// Research by Name logic
const researchByNameLogic = async (fullName) => {
    if (!fullName || typeof fullName !== 'string') {
        logger.warn('Invalid input: fullName is required and must be a string', { fullName });
        throw new Error('Invalid input: fullName is required and must be a string.');
    }

    let inferredData;
    try {
        logger.info('Step 1: Inferring details using GPT', { fullName });
        inferredData = await inferDetailsUsingGPT(fullName);
        logger.info('Inferred details from GPT', { inferredData });
    } catch (error) {
        logger.error('Error in Step 1: GPT inference failed', { fullName, error: error.message });
        throw new Error('Failed to infer details using GPT.');
    }

    let searchResults, websiteContent;
    try {
        logger.info(`Step 2: Performing Google search`, { name: inferredData.name });
        searchResults = await googleSearch(inferredData.name);
        logger.info('Google search results retrieved', { searchResults });

        if (inferredData.website) {
            logger.info(`Scraping website for URL`, { website: inferredData.website });
            websiteContent = await scrapeWebsite(inferredData.website);
            logger.info('Website content scraped successfully', { websiteContent });
        }
    } catch (error) {
        logger.error('Error in Step 2: Google search or website scraping failed', {
            name: inferredData.name,
            website: inferredData.website,
            error: error.message,
        });
        throw new Error('Failed to perform Google search and scrape.');
    }

    const analysisPrompt = `Analyze the following data to determine the most accurate details about the individual:
    Name: ${inferredData.name}
    Company: ${inferredData.company || 'N/A'}
    Website: ${inferredData.website || 'N/A'}
    Google Search Results: ${JSON.stringify(searchResults, null, 2)}
    Website Content: ${websiteContent || 'N/A'}

    Output only a JSON response with the following fields:
    {
        "name": "<Full Name>",
        "company": "<Company Name or null>",
        "website": "<Website URL or null>",
        "type": "<Type of profession, e.g., 'Business Coach' or 'Therapist'>",
        "isCoachOrTherapist": "<Yes or No>",
        "keyDetails": "<A short description summarizing key details about the individual>"
    }`;

    try {
        logger.info('Step 3: Analyzing combined data using GPT', { name: inferredData.name });
        const rawAnalysisResponse = await askGPT(analysisPrompt);
        logger.info('Raw analysis response from GPT received', { rawAnalysisResponse });
        return cleanJsonResponse(rawAnalysisResponse);
    } catch (error) {
        logger.error('Error in Step 3: Data analysis with GPT failed', { name: inferredData.name, error: error.message });
        throw new Error('Failed to analyze combined data.');
    }
};

module.exports = researchByNameLogic;
