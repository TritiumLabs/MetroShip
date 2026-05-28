// Replace 'YOUR_CLIENT_ID' with the Client ID provided by Hack Club OAuth
const CLIENT_ID = '3fa659eb0cbcf147ed16dee0abdc0962'; 
const REDIRECT_URI = window.location.origin + window.location.pathname;
// When using serverless functions, this is often a relative path on your same domain
const BACKEND_TOKEN_EXCHANGE_URL = '/api/exchange-token'; 

document.getElementById('login-link')?.addEventListener('click', (e) => {
    e.preventDefault();
    const authUrl = new URL('https://oauth.hackclub.com/authorize');
    authUrl.searchParams.set('client_id', CLIENT_ID);
    authUrl.searchParams.set('redirect_uri', REDIRECT_URI);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', 'read:user');

    window.location.href = authUrl.toString();
});

window.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');

    if (code && !localStorage.getItem('loggedIn')) { // Add a check to prevent re-exchanging on refresh
        console.log('Authorization code received:', code);

        fetch(BACKEND_TOKEN_EXCHANGE_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ code: code }),
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                localStorage.setItem('loggedIn', 'true');
                localStorage.setItem('access_token', data.accessToken);
                alert('Logged in successfully!');
                
                // Remove the 'code' from the URL without refreshing the page
                const newUrl = window.location.origin + window.location.pathname;
                window.history.replaceState({}, document.title, newUrl);
            } else {
                console.error('Login failed:', data.error);
                alert('Login failed: ' + (data.error || 'Unknown error'));
            }
        })
        .catch(error => console.error('Error sending code to backend:', error));
    }
});