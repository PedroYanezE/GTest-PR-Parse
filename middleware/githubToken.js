const pool = require('../db');
const refreshToken = require('../utils/refreshToken');

const githubTokenMiddleware = async (req, res, next) => {
  try {
    const result = await pool.query('SELECT * FROM token ORDER BY created_at DESC LIMIT 1');

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No token found in the database' });
    }

    let tokenData = result.rows[0];

    const createdAt = new Date(tokenData.created_at);
    const expiresInMs = tokenData.expires_in * 1000;
    const now = new Date();
    const isExpired = now.getTime() >= (createdAt.getTime() + expiresInMs);

    if (isExpired) {
      tokenData = await refreshToken({
        clientId: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        refreshToken: tokenData.refresh_token,
      });

      const insertQuery = `
        INSERT INTO token (
          access_token,
          expires_in,
          refresh_token,
          refresh_token_expires_in,
          scope,
          token_type
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id
      `;

      const insertValues = [
        tokenData.access_token,
        tokenData.expires_in,
        tokenData.refresh_token,
        tokenData.refresh_token_expires_in,
        tokenData.scope || '',
        tokenData.token_type
      ];

      await pool.query(insertQuery, insertValues);
    }

    // Attach token to request
    req.githubAccessToken = tokenData.access_token;
    next();
  } catch (error) {
    console.error('GitHub token middleware error:', error);
    res.status(500).json({ error: 'Failed to obtain GitHub token' });
  }
};

module.exports = githubTokenMiddleware;
