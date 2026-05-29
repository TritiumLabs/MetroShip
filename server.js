const express = require('express');
const path = require('path');
const dotenv = require('dotenv');

// Load variables from .env.local
dotenv.config({ path: '.env.local' });

const app = express();
const PORT = 3000;

app.use(express.json());

// Serve your static frontend files (index.html, auth.js, map.js)
// SECURITY: Use 'dotfiles: deny' to prevent serving sensitive hidden files like .env.local
// In a production setup, it is best to move frontend assets to a /public folder.
app.use(express.static(__dirname, {
    dotfiles: 'deny',
    index: 'index.html'
}));

// API route for token exchange (Replicates the Vercel function logic)
app.post('/api/exchange-token', async (req, res) => {
    try {
        const { code, redirect_uri } = req.body;
        if (!code) return res.status(400).json({ error: 'No code provided' });

        const CLIENT_ID = '3fa659eb0cbcf147ed16dee0abdc0962';
        const CLIENT_SECRET = process.env.CLIENT_SECRET;

        // Note: Built-in fetch requires Node.js v18+ 
        const response = await fetch('https://auth.hackclub.com/oauth/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET,
                code: code.trim(),
                redirect_uri: redirect_uri,
                grant_type: 'authorization_code'
            }),
        });

        // Check if the response is OK and if it's JSON
        const contentType = response.headers.get('content-type');
        if (!response.ok || !contentType || !contentType.includes('application/json')) {
            const errorText = await response.text();
            console.error('Error response from Hack Club OAuth:', response.status, response.statusText, errorText);
            return res.status(response.status).json({ success: false, error: `Hack Club OAuth API error: ${response.statusText}`, details: errorText });
        }

        const data = await response.json(); // Now it's safer to parse as JSON

        if (data.error) {
            return res.status(400).json({ success: false, error: data.error_description || data.error });
        }

        res.json({ success: true, accessToken: data.access_token });
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.listen(PORT, () => console.log(`Test environment running at http://localhost:${PORT}`));