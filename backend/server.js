require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const Groq = require('groq-sdk');

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Groq SDK
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Middleware
const allowedOrigins = process.env.ALLOWED_ORIGINS 
    ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
    : ['http://localhost:5173', 'http://127.0.0.1:5173'];

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps, curl, or server-to-server)
        if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        return callback(new Error('CORS policy violation: Origin not allowed'));
    },
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

        // Format history for Groq API
        // Groq uses 'assistant' instead of 'model', and 'content' instead of 'parts[{text}]'
        const formattedHistory = (chatHistory || []).map(msg => ({
            role: msg.role === 'model' ? 'assistant' : 'user',
            content: msg.text
        }));

        // Groq doesn't require history to start with a 'user' message as strictly as Gemini,
        // but we still strip the initial UI greeting for context cleanliness.
        while (formattedHistory.length > 0 && formattedHistory[0].role !== 'user') {
            formattedHistory.shift();
        }

        // Construct the full message array for Groq
        const messages = [
            { role: "system", content: systemInstruction },
            ...formattedHistory,
            { role: "user", content: question }
        ];

        // Call Groq API
        const chatCompletion = await groq.chat.completions.create({
            messages: messages,
            model: "openai/gpt-oss-20b", // Using a fast Groq model
        });
        
        res.json({ reply: chatCompletion.choices[0]?.message?.content || "" });

    } catch (error) {
        console.error("Groq API Error:", error);
        res.status(500).json({ error: "Something went wrong, please try again." });
    }
});

app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
});
