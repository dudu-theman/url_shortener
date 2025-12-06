CREATE TABLE IF NOT EXISTS url_mappings (
    id SERIAL PRIMARY KEY,
    short_code VARCHAR(6) UNIQUE NOT NULL,
    original_url TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP,
    click_count INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_short_code ON url_mappings(short_code);

