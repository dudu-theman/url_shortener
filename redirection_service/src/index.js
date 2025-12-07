const express = require('express');
const cors = require('cors');
const pool = require('./database');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

app.get('/:shortCode', async (req, res) => {
    try {
        const { shortCode } = req.params;

        if (shortCode.length !== 6 || !/^[a-zA-Z0-9]{6}$/.test(shortCode)) {
            return res.status(400).json({ error: 'Invalid short code format' });
        }

        const result = await pool.query(
            'SELECT original_url FROM url_mappings WHERE short_code = $1',
            [shortCode]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Short URL not found' });
        }

        originalUrl = result.rows[0][original_url];

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
