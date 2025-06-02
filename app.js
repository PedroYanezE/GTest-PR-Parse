require('dotenv').config();
const cors = require('cors');
const express = require('express');
const pool = require('./db');
const refreshToken = require('./utils/refreshToken');
const githubTokenMiddleware = require('./middleware/githubToken');

const app = express();
app.use(express.json());
app.use(cors({
  origin: 'http://localhost:5173',
  methods: 'GET,POST',
  allowedHeaders: 'Content-Type,Authorization',
  credentials: true
}));

app.post('/', async (req, res) => {
  const { code } = req.body;

  if (!code) {
    return res.status(400).json({ error: 'Code is required' });
  }

  try {
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.CLIENT_ID,
        client_secret: process.env.CLIENT_SECRET,
        code
      })
    });

    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token) {
      throw new Error('Failed to retrieve access token');
    }

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
    res.json({ receivedToken: tokenData });

  } catch (error) {
    console.error('Error fetching access token:', error);
    res.status(500).json({ error: 'Failed to fetch access token' });
  }
});

app.get('/user', githubTokenMiddleware, async (req, res) => {
  try {
    const response = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${req.githubAccessToken}`,
        'Accept': 'application/vnd.github+json'
      }
    });

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const data = await response.json();
    res.json(data);

  } catch (error) {
    console.error('Error fetching user data:', error);
    res.status(500).json({ error: 'Failed to fetch user data' });
  }
});

app.get('/repos', githubTokenMiddleware, async (req, res) => {
  try {
    const response = await fetch(`https://api.github.com/users/${'PedroYanezE'}/repos`, {
      headers: {
        'Authorization': `Bearer ${req.githubAccessToken}`,
        'Accept': 'application/vnd.github+json'
      }
    });

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const data = await response.json();
    res.json(data.map(d => ({
      id: d.id,
      name: d.name,
      owner: d.owner,
    })));
  } catch (error) {
    console.error('Error fetching user data:', error);
    res.status(500).json({ error: 'Failed to fetch user data' });
  }
});

app.get('/prs', githubTokenMiddleware, async (req, res) => {
  try {
    const response = await fetch(`https://api.github.com/repos/${'PedroYanezE'}/${'github-api-test'}/pulls`, {
      headers: {
        'Authorization': `Bearer ${req.githubAccessToken}`,
        'Accept': 'application/vnd.github+json'
      }
    });

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const data = await response.json();

    res.json(data);
  } catch (error) {
    throw new Error(`Couldn't retrieve requested data`);
  }
});

app.get('/prs/:id', githubTokenMiddleware, async (req, res) => {
  try {
    const response = await fetch(`https://api.github.com/repos/PedroYanezE/github-api-test/pulls/${req.params.id}`, {
      headers: {
        'Authorization': `Bearer ${req.githubAccessToken}`,
        'Accept': 'application/vnd.github.v3.diff'
      }
    });

    if (!response.ok) {
      res.sendStatus(400);
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const data = await response.text();
    res.send(data);
  } catch (error) {
    console.error(error);
    res.sendStatus(400);
  }
});

const port = 3000;
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
