import fetch from "node-fetch";
import process from "process";
import { verifyOAuthState } from '../lib/oauth-state.js';

function sendAuthError(res, status, title, message) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.status(status).send(`
    <!DOCTYPE html>
    <html>
      <head><title>${title}</title></head>
      <body>
        <h2>${title}</h2>
        <p>${message}</p>
        <p>Please close this window and try again.</p>
      </body>
    </html>
  `);
}

export default async (req, res) => {
  const { code, error, state } = req.query;
  const GITHUB_CLIENT_ID = process.env.OAUTH_GITHUB_CLIENT_ID || process.env.GITHUB_CLIENT_ID;
  const GITHUB_CLIENT_SECRET = process.env.OAUTH_GITHUB_CLIENT_SECRET || process.env.GITHUB_CLIENT_SECRET;

  if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET) {
    console.error('Missing GitHub OAuth credentials');
    sendAuthError(res, 500, 'Authentication Failed', 'GitHub OAuth credentials are not configured.');
    return;
  }

  if (error) {
    sendAuthError(res, 400, 'Authentication Failed', 'GitHub did not complete the OAuth flow.');
    return;
  }

  if (!code) {
    sendAuthError(res, 400, 'Authentication Failed', 'No authorization code was received.');
    return;
  }

  let oauthState;
  try {
    oauthState = verifyOAuthState(state);
  } catch (stateError) {
    console.error('Invalid OAuth state:', stateError.message);
    sendAuthError(res, 400, 'Authentication Failed', 'Invalid OAuth state.');
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
      sendAuthError(res, 400, 'Authentication Failed', 'GitHub rejected the token exchange.');
      return;
    }

    const { access_token } = data;
    const trustedOrigin = oauthState.origin;

    res.setHeader('Cache-Control', 'no-store');
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
            const token = ${JSON.stringify(access_token)};
            const trustedOrigin = ${JSON.stringify(trustedOrigin)};
            const hasOpener = !!window.opener;
            const authMessage = \`authorization:github:success:\${JSON.stringify({ token, provider: 'github' })}\`;

            if (hasOpener) {
              try {
                // Initiate two-way handshake with Decap CMS
                window.opener.postMessage("authorizing:github", trustedOrigin);

                let handshakeComplete = false;
                const receiveMessage = (event) => {
                  if (event.origin !== trustedOrigin) {
                    return;
                  }

                  if (event.data && typeof event.data === 'string' && event.data.includes('authorizing')) {
                    handshakeComplete = true;
                    window.opener.postMessage(authMessage, trustedOrigin);

                    window.removeEventListener('message', receiveMessage);
                    setTimeout(() => window.close(), 1000);
                  }
                };

                window.addEventListener('message', receiveMessage, false);

                // Fallback: if no acknowledgment within 5 seconds, send token directly
                setTimeout(() => {
                  if (!handshakeComplete) {
                    window.opener.postMessage(authMessage, trustedOrigin);
                    window.removeEventListener('message', receiveMessage);
                    setTimeout(() => window.close(), 1000);
                  }
                }, 5000);

                try { window.opener.focus(); } catch (e) {}

              } catch (err) {
                console.error('OAuth handshake error:', err);
                try {
                  window.opener.postMessage(authMessage, trustedOrigin);
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
    sendAuthError(res, 500, 'Authentication Failed', 'The OAuth callback could not be completed.');
  }
};
