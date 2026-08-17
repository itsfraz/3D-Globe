const express = require('express');
const router = express.Router();
const aiService = require('../services/aiService');

// POST /api/ai/chat
router.post('/chat', async (req, res) => {
    const { contextType, contextData, question, chatHistory } = req.body;

    // 1. Validation
    if (!question || typeof question !== 'string' || question.trim() === '') {
        return res.status(400).json({ error: "Missing or invalid 'question' field." });
    }

    if (question.length > 500) {
        return res.status(400).json({ error: "Question is too long (max 500 characters)." });
    }

    if (contextType === 'country') {
        if (!contextData?.country || typeof contextData.country !== 'string') {
            return res.status(400).json({ error: "Missing 'country' in contextData." });
        }
    } else if (contextType === 'compare') {
        if (!contextData?.countryA || !contextData?.countryB) {
            return res.status(400).json({ error: "Missing 'countryA' or 'countryB' in contextData." });
        }
    } else if (contextType !== 'global') {
        return res.status(400).json({ error: "Invalid contextType. Must be 'global', 'country', or 'compare'." });
    }

    // 2. Process Request
    try {
        const reply = await aiService.generateChatResponse({
            contextType,
            contextData,
            question,
            chatHistory: Array.isArray(chatHistory) ? chatHistory : []
        });

        res.json({ reply });
    } catch (error) {
        // Handle specific errors
        if (error.message === 'Request timed out') {
            return res.status(504).json({ error: "The AI took too long to respond. Please try again." });
        }
        
        console.error("AI Route Error:", error);
        res.status(500).json({ error: "Something went wrong processing your request." });
    }
});

module.exports = router;
