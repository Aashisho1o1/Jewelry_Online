import fetch from "node-fetch";

export default async (req, res) => {
  console.log('🔍 STEP 3: Callback endpoint called');
  console.log('🔍 STEP 3: Request method:', req.method);

  const { code, state, error } = req.query;
  const GITHUB_CLIENT_ID = process.env.OAUTH_GITHUB_CLIENT_ID || process.env.GITHUB_CLIENT_ID;
  const GITHUB_CLIENT_SECRET = process.env.OAUTH_GITHUB_CLIENT_SECRET || process.env.GITHUB_CLIENT_SECRET;

  console.log('🔍 STEP 3: OAuth callback parameters:');
  console.log('🔍 STEP 3: Code received:', code ? 'YES' : 'NO');
  console.log('🔍 STEP 3: State received:', state || 'NONE');
  console.log('🔍 STEP 3: Error received:', error || 'NONE');

  console.log('🔍 STEP 3: Environment variables configured:', !!GITHUB_CLIENT_ID && !!GITHUB_CLIENT_SECRET);

  if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET) {
    console.error('❌ STEP 3: Missing GitHub OAuth credentials');
    res.status(500).send("GitHub OAuth credentials are not configured.");
    return;
  }

  if (error) {
    console.error('❌ STEP 3: GitHub OAuth error received:', error);
    res.status(400).send(`GitHub OAuth error: ${error}`);
    return;
  }

  if (!code) {
    console.error('❌ STEP 3: No authorization code received from GitHub');
    res.status(400).send("No authorization code received");
    return;
  }

  console.log('✅ STEP 3: All parameters validated, proceeding with token exchange');

  try {
    console.log('🔍 STEP 3: Exchanging authorization code for access token...');

    const tokenRequest = {
      client_id: GITHUB_CLIENT_ID,
      client_secret: GITHUB_CLIENT_SECRET,
      code: code
    };
    
    const response = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(tokenRequest),
    });

    console.log('🔍 STEP 3: GitHub token response status:', response.status);

    const data = await response.json();

    if (data.error) {
      console.error('❌ STEP 3: GitHub token exchange failed');
    } else {
      console.log('✅ STEP 3: GitHub token exchange successful');
    }

    if (data.error) {
      console.error('GitHub OAuth error:', data.error_description);
      res.status(400).send(`Error from GitHub: ${data.error_description}`);
      return;
    }

    const { access_token } = data;
    console.log('🔍 STEP 3: Access token extracted:', !!access_token);
    console.log('✅ STEP 3: Preparing success response with postMessage');

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
            console.log('🔍 STEP 4: Callback popup script starting...');

            const token = '${access_token}';
            const hasOpener = !!window.opener;

            console.log('🔍 STEP 4: Token received:', token ? 'YES' : 'NO');
            console.log('🔍 STEP 4: Window opener available:', hasOpener);
            
            document.getElementById('opener-status').textContent = hasOpener ? 'Available' : 'Not available';
            
            // Implement proper two-way handshake as required by Decap CMS
            if (hasOpener) {
              try {
                console.log('🔍 STEP 4: Implementing two-way OAuth handshake');

                // STEP 4A: Initiate handshake - tell CMS we're starting authorization
                console.log('🔍 STEP 4A: Sending authorization initiation message');
                window.opener.postMessage("authorizing:github", "*");
                document.getElementById('message-status').textContent = 'Handshake initiated...';
                
                // STEP 4B: Wait for acknowledgment from CMS
                let handshakeComplete = false;
                const receiveMessage = (event) => {
                  console.log('🔍 STEP 4B: Received handshake response:', event.data);
                  
                  // Check if this is the acknowledgment we're waiting for
                  if (event.data && typeof event.data === 'string' && event.data.includes('authorizing')) {
                    console.log('✅ STEP 4B: CMS acknowledged handshake');
                    handshakeComplete = true;
                    
                    // STEP 4C: Send the actual token after acknowledgment
                    console.log('🔍 STEP 4C: Sending token after acknowledgment');
                    
                    // Send in the exact format Decap CMS expects
                    const tokenData = {
                      token: token,
                      provider: 'github'
                    };
                    
                    const authMessage = \`authorization:github:success:\${JSON.stringify(tokenData)}\`;
                    console.log('🔍 STEP 4C: Final auth message:', authMessage);
                    
                    window.opener.postMessage(authMessage, event.origin);
                    console.log('✅ STEP 4C: Token sent successfully');
                    document.getElementById('message-status').textContent = 'Token sent after handshake ✅';
                    
                    // Clean up listener
                    window.removeEventListener('message', receiveMessage);
                    
                    // Close popup after successful handshake
                    setTimeout(() => {
                      console.log('🔍 STEP 4: Closing popup after successful handshake');
                      window.close();
                    }, 1000);
                  } else {
                    console.log('🔍 STEP 4B: Waiting for proper acknowledgment, received:', event.data);
                  }
                };
                
                // Set up listener for CMS acknowledgment
                window.addEventListener('message', receiveMessage, false);
                
                // Fallback: if no acknowledgment received within 5 seconds, send token anyway
                setTimeout(() => {
                  if (!handshakeComplete) {
                    console.log('⚠️ STEP 4: No acknowledgment received, sending token directly (fallback)');
                    
                    // Try both modern and legacy formats as fallback
                    const modernMessage = {
                      type: 'authorization',
                      provider: 'github',
                      result: 'success',
                      token: token,
                      auth: {
                        token: token,
                        provider: 'github'
                      }
                    };
                    
                    window.opener.postMessage(modernMessage, '*');
                    window.opener.postMessage(\`authorization:github:success:\${token}\`, '*');
                    
                    console.log('⚠️ STEP 4: Fallback messages sent');
                    document.getElementById('message-status').textContent = 'Fallback token sent';
                    
                    window.removeEventListener('message', receiveMessage);
                    setTimeout(() => window.close(), 1000);
                  }
                }, 5000);
                
                // Try to focus the parent window
                try {
                  window.opener.focus();
                } catch (e) {
                  console.warn('Could not focus parent window:', e);
                }
                
              } catch (err) {
                console.error('❌ STEP 4: Error in OAuth handshake:', err);
                console.error('❌ STEP 4: Error details:', err.message);
                document.getElementById('message-status').textContent = 'Handshake error: ' + err.message;
                
                // Fallback: send token directly if handshake fails
                try {
                  console.log('⚠️ STEP 4: Handshake failed, sending token directly');
                  window.opener.postMessage(\`authorization:github:success:\${token}\`, '*');
                  setTimeout(() => window.close(), 1000);
                } catch (fallbackErr) {
                  console.error('❌ STEP 4: Fallback also failed:', fallbackErr);
                }
              }
            } else {
              console.log('❌ STEP 4: No window opener available, redirecting to /admin');
              document.getElementById('message-status').textContent = 'Redirecting to /admin...';
              setTimeout(() => {
                console.log('🔍 STEP 4: Redirecting to /admin...');
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