export default (req, res) => {
  console.log('🔍 STEP 2: Auth endpoint called');
  console.log('🔍 STEP 2: Request method:', req.method);
  console.log('🔍 STEP 2: Request URL:', req.url);
  console.log('🔍 STEP 2: Request headers:', JSON.stringify(req.headers, null, 2));
  console.log('🔍 STEP 2: Query parameters:', JSON.stringify(req.query, null, 2));
  
  const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
  const { site_id } = req.query;
  
  console.log('🔍 STEP 2: Environment check:');
  console.log('🔍 STEP 2: GITHUB_CLIENT_ID exists:', !!GITHUB_CLIENT_ID);
  console.log('🔍 STEP 2: GITHUB_CLIENT_ID value:', GITHUB_CLIENT_ID ? `${GITHUB_CLIENT_ID.substring(0, 8)}...` : 'MISSING');
  console.log('🔍 STEP 2: Site ID from query:', site_id);
  
  if (!GITHUB_CLIENT_ID) {
    console.error('❌ STEP 2: GITHUB_CLIENT_ID is not configured');
    res.status(500).json({ 
      error: 'GITHUB_CLIENT_ID is not configured',
      message: 'Please check your environment variables in Vercel dashboard'
    });
    return;
  }

  console.log('✅ STEP 2: Environment variables validated');

  // Build the GitHub OAuth URL with proper parameters
  const baseUrl = req.headers.host ? `https://${req.headers.host}` : 'https://jewelry-online.vercel.app';
  const redirectUri = `${baseUrl}/callback`;
  
  console.log('🔍 STEP 2: Building OAuth URL:');
  console.log('🔍 STEP 2: Base URL:', baseUrl);
  console.log('🔍 STEP 2: Redirect URI:', redirectUri);
  console.log('🔍 STEP 2: Client ID:', GITHUB_CLIENT_ID ? `${GITHUB_CLIENT_ID.substring(0, 8)}...` : 'MISSING');
  console.log('🔍 STEP 2: Scope:', 'repo,user,read:user,user:email');
  console.log('🔍 STEP 2: State:', site_id || 'default');
  
  const params = new URLSearchParams({
    client_id: GITHUB_CLIENT_ID,
    redirect_uri: redirectUri,
    scope: 'repo,user,read:user,user:email',
    state: site_id || 'default'
  });

  const redirectUrl = `https://github.com/login/oauth/authorize?${params.toString()}`;
  console.log('🔍 STEP 2: Final GitHub OAuth URL:', redirectUrl);
  console.log('✅ STEP 2: Redirecting to GitHub OAuth...');
  
  res.redirect(302, redirectUrl);
}; 