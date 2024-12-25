const { askGPT } = require('./chatGpt');
const googleSearch = require('./googleSearch');
const scrapeWebsite = require('./scrapeWebsite');

// Function to clean and parse the JSON response from GPT
const cleanJsonResponse = (response) => {
    try {
        const jsonMatch = response.match(/```json([\s\S]*?)```/);
        if (jsonMatch && jsonMatch.length >= 2) {
            const jsonString = jsonMatch[1].trim();
            return JSON.parse(jsonString);
        }
        return JSON.parse(response);
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
        const rawGPTResponse = await askGPT(gptPrompt);
        inferredData = cleanJsonResponse(rawGPTResponse);
    } catch (error) {
        throw new Error('Failed to infer details using GPT.', error);
    }
    return inferredData;
};

// Research by Name route
module.exports = async (req, res) => {
    const { fullName } = req.body;

    if (!fullName || typeof fullName !== 'string') {
        return res.status(400).json({ error: 'Invalid input: fullName is required and must be a string.' });
    }

    let inferredData;
    try {
        inferredData = await inferDetailsUsingGPT(fullName);
    } catch (error) {
        return res.status(500).json({ error: 'Failed to infer details using GPT', details: error.message });
    }

    let searchResults, websiteContent;
    try {
        searchResults = await googleSearch(inferredData.name);

        // Only scrape the website if a valid URL is available
        if (inferredData.website && typeof inferredData.website === 'string' && inferredData.website.startsWith('http')) {
            websiteContent = await scrapeWebsite(inferredData.website);
        }
    } catch (error) {
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
        const rawAnalysisResponse = await askGPT(analysisPrompt);
        const analysisData = cleanJsonResponse(rawAnalysisResponse);
        return res.json(analysisData);
    } catch (error) {
        return res.status(500).json({ error: 'Failed to analyze combined data', details: error.message });
    }
};
