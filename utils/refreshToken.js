module.exports = async function refreshToken({ clientId, clientSecret, refreshToken }) {
    const params = new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token'
    });

    const url = `https://github.com/login/oauth/access_token?${params.toString()}`;

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json'
        }
    })
    .then(res => {
        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
    })
    .catch(error => {
        console.error('Error during token refresh:', error);
        throw error;
    });

    return response;
}
