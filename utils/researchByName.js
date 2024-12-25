const { askGPT } = require('./chatGpt');
const googleSearch = require('./googleSearch');
const scrapeWebsite = require('./scrapeWebsite');

// Function to clean and parse the GPT response
const cleanJsonResponse = (response) => {
    try {
        // Trim and remove unwanted characters (such as backticks, extra spaces)
        const jsonResponse = response.trim();

        // Log the raw response for debugging
        console.log('Raw GPT Response:', jsonResponse);

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
        console.error('Failed to parse GPT response:', response);
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

    let inferredData;
    try {
        console.log('Sending GPT prompt:', gptPrompt);  // Log the GPT prompt
        const rawGPTResponse = await askGPT(gptPrompt);
        console.log('Raw GPT Response:', rawGPTResponse);  // Log the raw GPT response
        inferredData = cleanJsonResponse(rawGPTResponse);
    } catch (error) {
        console.error('Error during GPT inference:', error.message);
        throw new Error('Failed to infer details using GPT.');
    }
    return inferredData;
};

// Research by Name route
module.exports = async (req, res) => {
    const { fullName } = req.body;

    if (!fullName || typeof fullName !== 'string') {
        console.error('Invalid input: fullName is required and must be a string.');
        return res.status(400).json({ error: 'Invalid input: fullName is required and must be a string.' });
    }

    console.log(`Received request for name: ${fullName}`);

    let inferredData;
    try {
        console.log('Step 1: Inferring details using GPT...');
        inferredData = await inferDetailsUsingGPT(fullName);
        console.log('Inferred Data:', inferredData);
    } catch (error) {
        console.error('Error in Step 1:', error.message);
        return res.status(500).json({ error: 'Failed to infer details using GPT', details: error.message });
    }

    let searchResults, websiteContent;
    try {
        console.log(`Step 2: Performing Google search for "${inferredData.name}"...`);
        searchResults = await googleSearch(inferredData.name);
        console.log('Google Search Results:', searchResults);

        if (inferredData.website) {
            console.log(`Scraping website for URL: ${inferredData.website}`);
            websiteContent = await scrapeWebsite(inferredData.website);
            console.log('Website Content:', websiteContent);
        }
    } catch (error) {
        console.error('Error in Step 2:', error.message);
        return res.status(500).json({ error: 'Failed to perform Google search and scrape', details: error.message });
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
        console.log('Step 3: Analyzing combined data using GPT...');
        const rawAnalysisResponse = await askGPT(analysisPrompt);
        console.log('Raw Analysis Response:', rawAnalysisResponse);

        const analysisData = cleanJsonResponse(rawAnalysisResponse);
        return res.json(analysisData);
    } catch (error) {
        console.error('Error in Step 3:', error.message);
        return res.status(500).json({ error: 'Failed to analyze combined data', details: error.message });
    }
};
