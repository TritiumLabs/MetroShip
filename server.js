const express = require('express');
const path = require('path');
const dotenv = require('dotenv');

// Load variables from .env.local
dotenv.config(); // This is more standard and looks for .env in the root

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

// API route for token exchange (Replicates the function logic)
app.post('/api/exchange-token', async (req, res) => {
    try {
        const { code, redirect_uri } = req.body;
        if (!code) return res.status(400).json({ error: 'No code provided' });
        console.log("exchange-token successfully called in server.js")
        const CLIENT_ID = '3fa659eb0cbcf147ed16dee0abdc0962';
        const CLIENT_SECRET = process.env.CLIENT_SECRET;

        if (!CLIENT_SECRET) {
            console.error('Error: CLIENT_SECRET is missing from environment variables.');
            return res.status(500).json({ success: false, error: 'Server configuration error: CLIENT_SECRET missing' });
        }

        const response = await fetch('https://auth.hackclub.com/oauth/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET,
                code: code.trim(),
                redirect_uri: redirect_uri, // This must match the URI used in the authorize link exactly
                grant_type: 'authorization_code'
            }),
        });

        const data = await response.json().catch(() => null);

        if (!response.ok) {
            console.error('Hack Club OAuth Error:', response.status, data);
            return res.status(response.status).json({ 
                success: false, 
                error: data?.error_description || data?.error || `Hack Club OAuth API error: ${response.statusText}`,
                details: data 
            });
        }

        //const data = await response.json(); // Now it's safer to parse as JSON

        if (data.error) {
            return res.status(400).json({ success: false, error: data.error_description || data.error });
        }

        res.json({ success: true, accessToken: data.access_token });
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// API route for Hackatime token exchange (Replicates the function logic)
app.post('/api/hackatime-exchange', async (req, res) => {
    try {
        const { code, redirect_uri } = req.body;

        if (!code) {
            return res.status(400).json({ error: 'No authorization code provided' });
        }
        console.log("hackatime-exchange successfully called in server.js, req info below:")
        console.log({code: code});
        console.log({redirect_uri: redirect_uri});


        // NOTE: This CLIENT_ID should match the one in hackatime-auth.js
        const CLIENT_ID = '2ciUev1XVQ1kwX5LMTWGnk0V1kabE8fH9tqAvHcWVTY'; 
        const CLIENT_SECRET = process.env.HACKATIME_SECRET; // Ensure this environment variable is set

        if (!CLIENT_SECRET) {
            return res.status(500).json({ error: 'HACKATIME_SECRET is not configured on the server.' });
        }

        const oauthResponse = await fetch('https://hackatime.hackclub.com/oauth/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET,
                code: String(code).trim(),
                redirect_uri: redirect_uri,
                grant_type: 'authorization_code'
            }),
        });

        const data = await oauthResponse.json().catch(() => null);

        if (!oauthResponse.ok) {
            console.error('Hackatime OAuth Error:', oauthResponse.status, data);
            return res.status(oauthResponse.status).json({ success: false, error: data?.error_description || data?.error || 'Auth provider error', details: data });
        }

        if (!data || data.error) {
            return res.status(400).json({ success: false, error: data?.error_description || 'Invalid response from Hackatime Auth' });
        }

        return res.status(200).json({ success: true, accessToken: data.access_token });

    } catch (error) {
        console.error('Hackatime exchange error:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/api/project-scripts', async (req, res) => {
    if (req.query.action === 'getUserData') {
        try {
            const accessToken = req.body.accessToken;
            const hackatimeResponse = await fetch(
                `https://hackatime.hackclub.com/api/v1/authenticated/me`,
                {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                    }
                }
        );

        if (!hackatimeResponse.ok) {
            const errorBody = await hackatimeResponse.text();
            console.error('Hackatime Error:', errorBody);
            return res.status(hackatimeResponse.status).json({ error: 'Failed to fetch from Hackatime' });
        }

        const data = await hackatimeResponse.json();
        console.log({htData: data});

        // Hackatime returns emails as a list. Extract the first one.
        let userEmail = null;
        if (Array.isArray(data.emails) && data.emails.length > 0) {
            userEmail = data.emails[0];
        } else {
            userEmail = data.email || (data.data && data.data.email);
        }

        if (!userEmail) {
            console.error('No email returned from Hackatime API', data);
            return res.status(404).json({ error: 'No email found' });
        }

        // Return the email to the frontend
        return res.status(200).json({ success: true, email: userEmail });
        } catch (error) {
            console.error('Hackatime email error:', error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    } else if(req.query.action === 'getProjects'){
        try {
            const accessToken = req.body.accessToken;
            const HTProjResponse = await fetch(
                `https://hackatime.hackclub.com/api/v1/authenticated/projects`,
                {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                    }
                }
        );

        if (!HTProjResponse.ok) {
            const errorBody = await HTProjResponse.text();
            console.error('Hackatime Error:', errorBody);
            return res.status(HTProjResponse.status).json({ error: 'Failed to fetch from Hackatime' });
        }

        const data = await HTProjResponse.json();
        console.log({htData: data});

        

        if (!data) {
            console.error('No email returned from Hackatime API', data);
            return res.status(404).json({ error: 'No email found' });
        }

        // Return the data to the frontend
        return res.status(200).json({ success: true, data: data });
        } catch (error) {
            console.error('Hackatime email error:', error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    }else if(req.query.action === 'patchHTProjectName'){
        const selectedProjectName = req.body.selectedProjectName;
        const selectedProjectATid = req.body.selectedProjectATid;
        console.log({selectedProjectName: selectedProjectName});
        console.log({selectedProjectATid: selectedProjectATid});
        try {
            const airtablePatchResponse = await fetch(
                `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/YSWS%20Project%20Submission/${selectedProjectATid}`,
                {
                    method: 'PATCH',
                    headers: {
                        Authorization: `Bearer ${process.env.AIRTABLE_PAT}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        fields: {
                            "Hackatime Project Name": selectedProjectName, //set the field in airtable to the HT project name
                        }
                    })
                }
            );
            if (!airtablePatchResponse.ok) {
                 const errorBody = await airtablePatchResponse.text();
                console.error('Airtable Patch Error:', errorBody);
                return res.status(airtablePatchResponse.status).json({ error: 'Failed to Patch to Airtable' });
            }
            const data = await airtablePatchResponse.json();
            console.log("Airtable patch success", data)
            return res.status(200).json({ success: true, data: data});

        } catch (error) {
            console.error('Airtable patch error:', error);
        }
    }else {
        try {
            const AIRTABLE_PAT = process.env.AIRTABLE_PAT;
            const BASE_ID = process.env.AIRTABLE_BASE_ID;
            const TABLE_NAME = 'YSWS Project Submission'; // Replace with your actual table name
            if (!req.body.email) return res.status(400).json({ error: 'No email provided' });
        // SECURITY: Email must be passed from frontend via query param, e.g., ?email=...
            const EMAIL = req.body.email;

            if (!AIRTABLE_PAT || !BASE_ID) {
                return res.status(500).json({ error: 'Airtable configuration missing on server.' });
            }

            // Query Airtable API
            // Note: Use the correct Airtable POST endpoint for listRecords (no trailing comma/space)
            const airtableResponse = await fetch(
                `https://api.airtable.com/v0/${BASE_ID}/${TABLE_NAME}/listRecords`,
                {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${AIRTABLE_PAT}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        filterByFormula: `{Email}='${EMAIL}'`,
                    })
                }
            );

            if (!airtableResponse.ok) {
                const errorBody = await airtableResponse.text();
                console.error('Airtable Error:', errorBody);
                return res.status(airtableResponse.status).json({ error: 'Failed to fetch from Airtable' });
            }

            const data = await airtableResponse.json();
            // Return the records to the frontend
            return res.status(200).json({ success: true, records: data.records});


        } catch (error) {
            console.error('Airtable fetch error:', error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    }
});



app.listen(PORT, () => console.log(`Test environment running at http://localhost:${PORT}`));