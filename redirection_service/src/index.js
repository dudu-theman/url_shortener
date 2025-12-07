const express = require('express');
const cors = require('cors');
const pool = require('./database');
const redis = require('./redis');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Cache TTL in seconds (1 hour)
const CACHE_TTL = 3600;

app.get('/:shortCode', async (req, res) => {
    try {
        const { shortCode } = req.params;

        if (shortCode.length !== 6 || !/^[a-zA-Z0-9]{6}$/.test(shortCode)) {
            return res.status(400).json({ error: 'Invalid short code format' });
        }

        // Try to get from Redis cache first
        const cachedUrl = await redis.get(shortCode);

        if (cachedUrl) {
            console.log(`Cache hit for ${shortCode}`);
            return res.redirect(301, cachedUrl);
        }

        console.log(`Cache miss for ${shortCode}, querying database`);

        // Cache miss - query database
        const result = await pool.query(
            'SELECT original_url FROM url_mappings WHERE short_code = $1',
            [shortCode]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Short URL not found' });
        }

        const originalUrl = result.rows[0].original_url;

        // Store in Redis cache with TTL
        await redis.setex(shortCode, CACHE_TTL, originalUrl);
        console.log(`Cached ${shortCode} for ${CACHE_TTL} seconds`);

        res.redirect(301, originalUrl);

    } catch (error) {
        console.error('Error redirecting:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`URL Redirection Service running on port ${PORT}`);
});
