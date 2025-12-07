const express = require('express');
const cors = require('cors');
const pool = require('./database');
require('dotenv').config();
const generateUniqueShortCode = require('./shortCodeGenerator');


const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/shorten', async (req, res) => {
    try {
        const { url } = req.body;

        if (!url) {
            return res.status(400).json({ error: 'URL is required' });
        }

        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            return res.status(400).json({ error: 'URL must start with http:// or https://'})
        }

        const shortCode = await generateUniqueShortCode(pool);

        await pool.query(
            'INSERT INTO url_mappings (short_code, original_url) VALUES ($1, $2)',
            [shortCode, url]
        );

        const shortUrl = `${process.env.BASE_URL || 'http://localhost'}${shortCode}`;

        res.status(201).json({
            shortCode,
            shortUrl,
            originalUrl: url
        });
    } catch (error) {
        console.error('Error creating short URL:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`URL Shortening Service running on port ${PORT}`);
});