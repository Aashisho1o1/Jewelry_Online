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
  const params = new URLSearchParams({
    client_id: GITHUB_CLIENT_ID,
    scope: 'repo,user,read:user,user:email',
    state: site_id || 'default' // Use site_id as state parameter
  });

  const redirectUrl = `https://github.com/login/oauth/authorize?${params.toString()}`;
  console.log('Redirecting to:', redirectUrl);
  
  res.redirect(302, redirectUrl);
}; 