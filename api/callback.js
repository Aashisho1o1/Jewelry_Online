import fetch from "node-fetch";

export default async (req, res) => {
  console.log('🔍 STEP 3: Callback endpoint called');
  console.log('🔍 STEP 3: Request method:', req.method);
  console.log('🔍 STEP 3: Request URL:', req.url);
  console.log('🔍 STEP 3: Query parameters:', JSON.stringify(req.query, null, 2));
  console.log('🔍 STEP 3: Request headers:', JSON.stringify(req.headers, null, 2));
  
  const { code, state, error } = req.query;
  const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
  const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;

  console.log('🔍 STEP 3: OAuth callback parameters:');
  console.log('🔍 STEP 3: Code received:', code ? 'YES' : 'NO');
  console.log('🔍 STEP 3: Code value:', code ? `${code.substring(0, 10)}...` : 'MISSING');
  console.log('🔍 STEP 3: State received:', state || 'NONE');
  console.log('🔍 STEP 3: Error received:', error || 'NONE');
  
  console.log('🔍 STEP 3: Environment variables:');
  console.log('🔍 STEP 3: GITHUB_CLIENT_ID exists:', !!GITHUB_CLIENT_ID);
  console.log('🔍 STEP 3: GITHUB_CLIENT_SECRET exists:', !!GITHUB_CLIENT_SECRET);
  console.log('🔍 STEP 3: CLIENT_ID value:', GITHUB_CLIENT_ID ? `${GITHUB_CLIENT_ID.substring(0, 8)}...` : 'MISSING');
  console.log('🔍 STEP 3: CLIENT_SECRET value:', GITHUB_CLIENT_SECRET ? `${GITHUB_CLIENT_SECRET.substring(0, 8)}...` : 'MISSING');

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
    console.log('🔍 STEP 3: Making request to GitHub token endpoint');
    
    const tokenRequest = {
      client_id: GITHUB_CLIENT_ID,
      client_secret: GITHUB_CLIENT_SECRET,
      code: code
    };
    
    console.log('🔍 STEP 3: Token request payload:', {
      client_id: GITHUB_CLIENT_ID ? `${GITHUB_CLIENT_ID.substring(0, 8)}...` : 'MISSING',
      client_secret: GITHUB_CLIENT_SECRET ? `${GITHUB_CLIENT_SECRET.substring(0, 8)}...` : 'MISSING',
      code: code ? `${code.substring(0, 10)}...` : 'MISSING'
    });
    
    const response = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(tokenRequest),
    });

    console.log('🔍 STEP 3: GitHub token response status:', response.status);
    console.log('🔍 STEP 3: GitHub token response headers:', Object.fromEntries(response.headers.entries()));

    const data = await response.json();
    console.log('🔍 STEP 3: GitHub token response data:', data);
    
    if (data.error) {
      console.error('❌ STEP 3: GitHub token exchange failed:', data.error);
      console.error('❌ STEP 3: Error description:', data.error_description);
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
    console.log('🔍 STEP 3: Access token value:', access_token ? `${access_token.substring(0, 10)}...` : 'MISSING');

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
            console.log('🔍 STEP 4: Window location:', window.location.href);
            console.log('🔍 STEP 4: Window origin:', window.location.origin);
            
            const token = '${access_token}';
            const hasOpener = !!window.opener;
            
            console.log('🔍 STEP 4: Token received:', token ? 'YES' : 'NO');
            console.log('🔍 STEP 4: Token value:', token ? token.substring(0, 10) + '...' : 'MISSING');
            console.log('🔍 STEP 4: Window opener available:', hasOpener);
            
            document.getElementById('opener-status').textContent = hasOpener ? 'Available' : 'Not available';
            
            // Send postMessage in the exact format Decap CMS 3.8.x expects
            if (hasOpener) {
              try {
                console.log('🔍 STEP 4: Preparing to send postMessage to parent window');
                console.log('🔍 STEP 4: Parent window origin:', window.opener.location.origin);
                
                // Modern Decap CMS expects this object format
                const authMessage = {
                  type: 'authorization',
                  provider: 'github',
                  result: 'success',
                  token: token,
                  auth: {
                    token: token,
                    provider: 'github'
                  }
                };
                
                console.log('🔍 STEP 4: Sending modern auth message:', authMessage);
                window.opener.postMessage(authMessage, '*');
                console.log('✅ STEP 4: Modern postMessage sent successfully');
                document.getElementById('message-status').textContent = 'Sent modern format to opener';
                
                // Also send legacy format for backward compatibility
                const legacyMessage = 'authorization:github:success:' + token;
                console.log('🔍 STEP 4: Sending legacy auth message:', legacyMessage);
                window.opener.postMessage(legacyMessage, '*');
                console.log('✅ STEP 4: Legacy postMessage sent successfully');
                
                // Try to focus the parent window
                try {
                  window.opener.focus();
                } catch (e) {
                  console.warn('Could not focus parent window:', e);
                }
                
                // Close popup after short delay
                setTimeout(() => {
                  console.log('🔍 STEP 4: Closing popup window...');
                  document.getElementById('message-status').textContent = 'Closing popup...';
                  window.close();
                  console.log('✅ STEP 4: Popup close requested');
                }, 1000);
              } catch (err) {
                console.error('❌ STEP 4: Error sending postMessage:', err);
                console.error('❌ STEP 4: Error details:', err.message);
                document.getElementById('message-status').textContent = 'Error: ' + err.message;
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