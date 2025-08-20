export default (req, res) => {
  const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
  const { site_id } = req.query;
  
  console.log('Auth endpoint called');
  console.log('Query parameters:', req.query);
  console.log('GITHUB_CLIENT_ID exists:', !!GITHUB_CLIENT_ID);
  console.log('Site ID from query:', site_id);
  
  if (!GITHUB_CLIENT_ID) {
    console.error('GITHUB_CLIENT_ID is not configured');
    res.status(500).json({ 
      error: 'GITHUB_CLIENT_ID is not configured',
      message: 'Please check your environment variables in Vercel dashboard'
    });
    return;
  }

  // Build the GitHub OAuth URL with proper parameters
  // CRITICAL FIX: Add redirect_uri parameter required by GitHub OAuth 2.0 spec
  // This MUST match the "Authorization callback URL" in GitHub OAuth App settings
  const baseUrl = req.headers.host ? `https://${req.headers.host}` : 'https://jewelry-online.vercel.app';
  const redirectUri = `${baseUrl}/callback`; // Must match GitHub OAuth App callback URL exactly
  
  const params = new URLSearchParams({
    client_id: GITHUB_CLIENT_ID,
    redirect_uri: redirectUri, // ← CRITICAL: Tells GitHub where to send user after auth
    scope: 'repo,user,read:user,user:email',
    state: site_id || 'default' // CSRF protection - GitHub sends this back unchanged
  });
  
  console.log('OAuth redirect_uri:', redirectUri);

  const redirectUrl = `https://github.com/login/oauth/authorize?${params.toString()}`;
  console.log('Redirecting to:', redirectUrl);
  
  res.redirect(302, redirectUrl);
}; 