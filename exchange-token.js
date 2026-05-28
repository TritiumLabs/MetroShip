export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { code } = req.body;
    const CLIENT_ID = '3fa659eb0cbcf147ed16dee0abdc0962'; // Public ID is fine to keep in code
    const CLIENT_SECRET = process.env.HACKCLUB_CLIENT_SECRET; // Pulled from Coolify/Server env

    try {
        const response = await fetch('https://auth.hackclub.com/api/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET,
                code: code,
                grant_type: 'authorization_code'
            }),
        });

        const data = await response.json();
        return res.status(200).json({ success: !!data.access_token, accessToken: data.access_token });
    } catch (error) {
        console.error('Exchange error:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}