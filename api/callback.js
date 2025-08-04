import fetch from "node-fetch";

export default async (req, res) => {
  const { code } = req.query;
  const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
  const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;

  console.log('Callback called with code:', code ? 'YES' : 'NO');
  console.log('Environment variables configured:', {
    clientId: !!GITHUB_CLIENT_ID,
    clientSecret: !!GITHUB_CLIENT_SECRET
  });

  if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET) {
    console.error('Missing GitHub OAuth credentials');
    res.status(500).send("GitHub OAuth credentials are not configured.");
    return;
  }

  try {
    console.log('Exchanging code for access token...');
    const response = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code,
      }),
    });

    const data = await response.json();
    console.log('GitHub response:', data.error ? `ERROR: ${data.error}` : 'SUCCESS');

    if (data.error) {
      console.error('GitHub OAuth error:', data.error_description);
      res.status(400).send(`Error from GitHub: ${data.error_description}`);
      return;
    }

    const { access_token } = data;
    console.log('Access token obtained:', !!access_token);

    // Return the success page with the correct postMessage format
    res.status(200).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>GitHub Authentication Success</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; text-align: center; }
            .success { color: #28a745; }
            .debug { background: #f8f9fa; padding: 15px; margin: 20px 0; border-radius: 5px; }
          </style>
        </head>
        <body>
          <h2 class="success">✅ Authentication Successful!</h2>
          <p>Redirecting you back to the CMS...</p>
          <p><small>If this window doesn't close automatically, please close it manually and return to the CMS tab.</small></p>
          <div class="debug">
            <strong>Debug Info:</strong><br>
            Access token: ${access_token ? 'Obtained' : 'Missing'}<br>
            Window opener: <span id="opener-status">Checking...</span><br>
            Message sent: <span id="message-status">Pending...</span>
          </div>
          <script>
            console.log('Callback script starting...');
            
            const token = '${access_token}';
            const hasOpener = !!window.opener;
            
            document.getElementById('opener-status').textContent = hasOpener ? 'Available' : 'Not available';
            
            // Send postMessage in the exact format Decap CMS expects
            if (hasOpener) {
              try {
                // Format: "authorization:github:success:TOKEN"
                const message = 'authorization:github:success:' + token;
                console.log('Sending message:', message);
                window.opener.postMessage(message, '*');
                document.getElementById('message-status').textContent = 'Sent to opener';
                
                // Also send a custom message with the token for localStorage
                const tokenMessage = {
                  type: 'GITHUB_AUTH_SUCCESS',
                  token: token,
                  provider: 'github',
                  backendName: 'github'
                };
                window.opener.postMessage(tokenMessage, '*');
                
                // Try to focus the parent window
                try {
                  window.opener.focus();
                } catch (e) {
                  console.warn('Could not focus parent window:', e);
                }
                
                // Close popup after short delay
                setTimeout(() => {
                  console.log('Closing popup...');
                  document.getElementById('message-status').textContent = 'Closing popup...';
                  window.close();
                  
                  // If window.close() doesn't work, try to redirect the opener
                  setTimeout(() => {
                    try {
                      if (window.opener && !window.opener.closed) {
                        window.opener.location.reload();
                      }
                    } catch (e) {
                      console.warn('Could not reload parent:', e);
                    }
                  }, 500);
                }, 1000);
              } catch (err) {
                console.error('Error sending message:', err);
                document.getElementById('message-status').textContent = 'Error: ' + err.message;
              }
            } else {
              // No opener, redirect to admin
              document.getElementById('message-status').textContent = 'Redirecting to /admin...';
              setTimeout(() => {
                window.location.href = '/admin';
              }, 1000);
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
        <head>
          <title>Authentication Error</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; text-align: center; }
            .error { color: #dc3545; }
          </style>
        </head>
        <body>
          <h2 class="error">❌ Authentication Failed</h2>
          <p>Error: ${error.message}</p>
          <p>Please close this window and try again.</p>
        </body>
      </html>
    `);
  }
}; 