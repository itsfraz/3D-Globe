const Groq = require('groq-sdk');

class AIService {
    constructor() {
        // Initialize Groq SDK only if API key is present
        this.groq = null;
        if (process.env.GROQ_API_KEY) {
            this.groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
        }
    }

    /**
     * Generates a context-aware AI response
     * @param {Object} params
     * @param {string} params.contextType 'global', 'country', 'compare'
     * @param {Object} params.contextData Data relevant to the context type
     * @param {string} params.question The user's query
     * @param {Array} params.chatHistory Previous chat messages
     * @returns {Promise<string>} The AI's response text
     */
    async generateChatResponse({ contextType, contextData, question, chatHistory = [] }) {
        if (!this.groq) {
            throw new Error("AI service is not configured. Missing GROQ_API_KEY.");
        }

        // Limit question length
        const safeQuestion = question.substring(0, 500);

        // Truncate history to last 10 messages to save tokens and prevent overload
        const recentHistory = chatHistory.slice(-10);

        let systemInstruction = "";

        switch (contextType) {
            case 'country':
                const country = contextData?.country || "the selected country";
                // Only pass fields that are relevant and not overly huge (like geojson polygons)
                const { name, officialName, capital, region, subregion, population, area, languages, currency_name, borders, iso_a3, iso_a2, cca3 } = contextData || {};
                const structuredInfo = JSON.stringify({ name, officialName, capital, region, subregion, population, area, languages, currency_name, borders }, null, 2);
                
                // Fetch GDP info dynamically using ISO3
                const { getCountryGDPByISO, getCountryGDP } = require('./worldBankService');
                const iso3Code = iso_a3 || cca3 || iso_a2;
                
                let gdpInfo = null;
                if (iso3Code) {
                    gdpInfo = await getCountryGDPByISO(iso3Code);
                }
                
                if (!gdpInfo && name) {
                    // Fallback to name-based global lookup
                    gdpInfo = await getCountryGDP(name);
                }
                
                let gdpContext = "";
                if (gdpInfo && gdpInfo.formattedGdp) {
                    gdpContext = `
ECONOMIC DATA — WORLD BANK
Country: ${gdpInfo.country}
ISO3: ${gdpInfo.iso3Code || iso3Code}
GDP: ${gdpInfo.formattedGdp}
GDP Year: ${gdpInfo.year}
Indicator: ${gdpInfo.indicator || 'NY.GDP.MKTP.CD'}
Source: ${gdpInfo.source || 'World Bank'}
`;
                }
                
                systemInstruction = `
You are the "AI World Guide", an expert travel and geography assistant.
The user is currently viewing ${country} on a 3D globe.

Here is the known structured data about this country (use this context to answer accurately without inventing facts):
${structuredInfo}
${gdpContext}

Answer all questions contextually for ${country}. If the user asks an ambiguous question such as "What is the capital?", interpret it as a question about the currently selected country.
If the user asks for a travel plan, provide a highly structured, day-by-day itinerary with specific cities, foods, and realistic budget estimates (clearly label estimates as approximations).

When the user asks about GDP, GDP size, economic output, nominal GDP, or current GDP, use the supplied World Bank GDP data first. Do not claim that GDP is unavailable when valid World Bank GDP data exists in the context. Never invent a GDP value. Always show the actual data year and mention World Bank as the source (e.g. "India's GDP is approximately $3.90 trillion (World Bank, 2024)."). If World Bank truly has no GDP value, explicitly say that the latest available World Bank GDP is unavailable for that country. Do not redirect the user to BEA or another external source when the application already has valid World Bank data.

Keep formatting clean using markdown headings and lists. Be concise but highly informative.
If information is uncertain or unavailable, clearly say so instead of inventing facts.
                `.trim();
                break;
            case 'compare':
                const countryA = contextData?.countryA || "Country A";
                const countryB = contextData?.countryB || "Country B";
                
                const { getCountryGDP: getGDP } = require('./worldBankService');
                const gdpA = await getGDP(countryA);
                const gdpB = await getGDP(countryB);
                let compareContext = "";
                if (gdpA || gdpB) {
                    compareContext = `\nWorld Bank GDP Data:\n- ${countryA}: ${gdpA ? gdpA.formattedGdp : 'Unknown'}\n- ${countryB}: ${gdpB ? gdpB.formattedGdp : 'Unknown'}\n`;
                }

                systemInstruction = `
You are the "AI World Guide", an analytical geography expert.
The user is comparing ${countryA} and ${countryB} side-by-side.${compareContext}
Answer questions by directly contrasting the two countries.
Use structured markdown (bullet points, bold text) to highlight differences in tourism, economy, culture, or whatever the user asks.
                `.trim();
                break;
            case 'global':
            default:
                systemInstruction = `
You are the "AI World Guide", an omniscient travel, geography, and culture expert attached to a 3D Earth visualization app.
The user is exploring the world. Answer questions about geography, travel planning, history, and world facts.
If the user asks for a trip plan, provide a structured itinerary using markdown.
If live or real-time data is requested (like current weather or live flight prices), politely inform the user that you don't have access to real-time data streams and provide general guidelines instead.
                `.trim();
                break;
        }

        // Format history for Groq API
        const formattedHistory = recentHistory.map(msg => ({
            role: msg.role === 'model' ? 'assistant' : 'user',
            content: msg.text
        }));

        // Groq prefers user/assistant alternating, ensure we don't start with assistant
        while (formattedHistory.length > 0 && formattedHistory[0].role !== 'user') {
            formattedHistory.shift();
        }

        const formattingGuidelines = `
CRITICAL FORMATTING RULES:
1. Format your response like ChatGPT or Gemini: clean, professional, readable, and highly scannable.
2. Use clear, concise headings (H3 '###' or H4 '####') to structure your answer.
3. Write short, digestible paragraphs (1-3 sentences max). Use plenty of line breaks.
4. Extensively use bulleted lists and numbered lists to break down information.
5. Use **bold text** to highlight key terms, metrics, and important concepts.
6. Use tables ONLY when comparing multiple data points (e.g., side-by-side stats).
7. Do NOT use horizontal rules ('---'), excessive separators, ASCII art, or unnecessary characters like '|' outside of tables.
8. NEVER output one large block of unbroken text.
9. Adopt a polished, authoritative, yet approachable tone typical of modern AI assistants.
`.trim();

        const messages = [
            { role: "system", content: systemInstruction + "\n\n" + formattingGuidelines },
            ...formattedHistory,
            { role: "user", content: safeQuestion }
        ];

        // Call Groq API with timeout protection (30s)
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Request timed out')), 30000)
        );

        try {
            const chatCompletionPromise = this.groq.chat.completions.create({
                messages: messages,
                model: "openai/gpt-oss-20b", // Using the fast Groq model from previous setup
            });

            // Race the API call against the timeout
            const response = await Promise.race([chatCompletionPromise, timeoutPromise]);
            
            return response.choices[0]?.message?.content || "I couldn't generate a response for that.";
        } catch (error) {
            console.error("[AIService] Generation Error:", error.message);
            throw error;
        }
    }
}

module.exports = new AIService();
