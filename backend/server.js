require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Middleware
app.use(cors({
    origin: 'http://localhost:5173', // Restrict to frontend dev URL
    methods: ['GET', 'POST']
}));
app.use(express.json());

// Rate limiting (max 20 requests per minute)
const apiLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 20,
    message: { error: 'Too many requests, please try again later.' }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: "ok" });
});

// Chat endpoint
app.post('/api/ask', apiLimiter, async (req, res) => {
    const { country, question, chatHistory } = req.body;

    // Validation
    if (!country || typeof country !== 'string' || country.trim() === '') {
        return res.status(400).json({ error: "Missing or invalid 'country' field." });
    }
    if (!question || typeof question !== 'string' || question.trim() === '') {
        return res.status(400).json({ error: "Missing or invalid 'question' field." });
    }

    try {
        const systemInstruction = `
You are a knowledgeable, friendly guide for the country ${country}.
The user is currently viewing information about ${country} on an interactive globe app.
Answer all questions about ${country} specifically and in an engaging, factual, conversational way,
even if the user's question doesn't explicitly mention the country's name — always assume it refers to ${country}.
Keep answers concise (2-4 sentences) unless the user asks for more detail.
If asked something unrelated to ${country}, its geography, culture, or history, politely steer the conversation back to ${country}.
`.trim();

        // Format history for Gemini SDK
        const formattedHistory = (chatHistory || []).map(msg => ({
            role: msg.role,
            parts: [{ text: msg.text }]
        }));

        // Gemini API strictly requires history to start with a 'user' message.
        // The UI inserts an initial greeting from the 'model', so we strip any leading model messages.
        while (formattedHistory.length > 0 && formattedHistory[0].role !== 'user') {
            formattedHistory.shift();
        }

        // Start chat session with history
        const chatSession = model.startChat({
            systemInstruction,
            history: formattedHistory
        });

        const result = await chatSession.sendMessage(question);
        
        res.json({ reply: result.response.text() });

    } catch (error) {
        console.error("Gemini API Error:", error);
        res.status(500).json({ error: "Something went wrong, please try again." });
    }
});

app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
});
