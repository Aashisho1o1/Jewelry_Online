import fetch from "node-fetch";
import process from "process";

export default async (req, res) => {
  const { code, error } = req.query;
  const GITHUB_CLIENT_ID = process.env.OAUTH_GITHUB_CLIENT_ID || process.env.GITHUB_CLIENT_ID;
  const GITHUB_CLIENT_SECRET = process.env.OAUTH_GITHUB_CLIENT_SECRET || process.env.GITHUB_CLIENT_SECRET;

  if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET) {
    console.error('Missing GitHub OAuth credentials');
    res.status(500).send("GitHub OAuth credentials are not configured.");
    return;
  }

  if (error) {
    res.status(400).send(`GitHub OAuth error: ${error}`);
    return;
  }

  if (!code) {
    res.status(400).send("No authorization code received");
    return;
  }

  try {
    const response = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code: code
      }),
    });

    const data = await response.json();

    if (data.error) {
      console.error('GitHub token exchange failed:', data.error_description);
      res.status(400).send(`Error from GitHub: ${data.error_description}`);
      return;
    }

    const { access_token } = data;

    res.status(200).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>GitHub Authentication Success</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; text-align: center; }
            .success { color: #28a745; }
          </style>
        </head>
        <body>
          <h2 class="success">Authentication Successful!</h2>
          <p>Redirecting you back to the CMS...</p>
          <p><small>If this window doesn't close automatically, please close it manually.</small></p>
          <script>
            const token = '${access_token}';
            const hasOpener = !!window.opener;

            if (hasOpener) {
              try {
                // Initiate two-way handshake with Decap CMS
                window.opener.postMessage("authorizing:github", "*");

                let handshakeComplete = false;
                const receiveMessage = (event) => {
                  if (event.data && typeof event.data === 'string' && event.data.includes('authorizing')) {
                    handshakeComplete = true;

                    const tokenData = { token: token, provider: 'github' };
                    const authMessage = \`authorization:github:success:\${JSON.stringify(tokenData)}\`;
                    window.opener.postMessage(authMessage, event.origin);

                    window.removeEventListener('message', receiveMessage);
                    setTimeout(() => window.close(), 1000);
                  }
                };

                window.addEventListener('message', receiveMessage, false);

                // Fallback: if no acknowledgment within 5 seconds, send token directly
                setTimeout(() => {
                  if (!handshakeComplete) {
                    window.opener.postMessage(\`authorization:github:success:\${token}\`, '*');
                    window.removeEventListener('message', receiveMessage);
                    setTimeout(() => window.close(), 1000);
                  }
                }, 5000);

                try { window.opener.focus(); } catch (e) {}

              } catch (err) {
                console.error('OAuth handshake error:', err);
                try {
                  window.opener.postMessage(\`authorization:github:success:\${token}\`, '*');
                  setTimeout(() => window.close(), 1000);
                } catch (e) {}
              }
            } else {
              setTimeout(() => { window.location.href = '/admin'; }, 1000);
            }
          </script>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('OAuth callback error:', error);
    res.status(500).send(`
      <!DOCTYPE html>
      <html>
        <head><title>Authentication Error</title></head>
        <body>
          <h2>Authentication Failed</h2>
          <p>Error: ${error.message}</p>
          <p>Please close this window and try again.</p>
        </body>
      </html>
    `);
  }
};
