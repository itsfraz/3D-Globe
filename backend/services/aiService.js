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
                systemInstruction = `
You are the "AI World Guide", an expert travel and geography assistant.
The user is currently viewing ${country} on a 3D globe.
Answer all questions contextually for ${country}. If the user asks "What food should I try?", they mean in ${country}.
If the user asks for a travel plan, provide a highly structured, day-by-day itinerary with specific cities, foods, and realistic budget estimates (clearly label estimates as approximations).
Keep formatting clean using markdown headings and lists. Be concise but highly informative.
                `.trim();
                break;
            case 'compare':
                const countryA = contextData?.countryA || "Country A";
                const countryB = contextData?.countryB || "Country B";
                systemInstruction = `
You are the "AI World Guide", an analytical geography expert.
The user is comparing ${countryA} and ${countryB} side-by-side.
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

        const messages = [
            { role: "system", content: systemInstruction },
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
