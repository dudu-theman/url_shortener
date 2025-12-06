const BASE62_CHARS = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

function generateShortCode() {
  let code = '';
  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(Math.random() * BASE62_CHARS.length);
    code += BASE62_CHARS[randomIndex];
  }
  return code;
}

async function generateUniqueShortCode(pool) {
  const maxAttempts = 5;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const shortCode = generateShortCode();

    const result = await pool.query(
      'SELECT short_code FROM url_mappings WHERE short_code = $1',
      [shortCode]
    );

    if (result.rows.length === 0) {
      return shortCode;
    }
  }

  throw new Error('Failed to generate unique short code after multiple attempts');
}

module.exports = generateUniqueShortCode;
