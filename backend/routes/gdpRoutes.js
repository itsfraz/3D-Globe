const express = require('express');
const router = express.Router();
const worldBankService = require('../services/worldBankService');

// GET /api/gdp/:iso
router.get('/:iso', async (req, res) => {
    const { iso } = req.params;
    
    if (!iso || iso.length < 2 || iso.length > 3) {
        return res.status(400).json({ error: "Invalid ISO code provided." });
    }

    try {
        const gdpData = await worldBankService.getCountryGDP(iso);
        
        if (!gdpData) {
            return res.status(404).json({ error: "GDP data not found for this country." });
        }

        res.json(gdpData);
    } catch (error) {
        console.error("GDP Route Error:", error);
        res.status(500).json({ error: "Something went wrong fetching GDP data." });
    }
});

module.exports = router;
