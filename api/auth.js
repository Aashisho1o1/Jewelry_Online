import logger from '../lib/logger.js';

export default (req, res) => {
  logger.log('🔍 Auth endpoint called');
  logger.log('Request method:', req.method);
  // Don't log headers - they contain sensitive auth info!
  
  const GITHUB_CLIENT_ID = process.env.OAUTH_GITHUB_CLIENT_ID || process.env.GITHUB_CLIENT_ID;
  const { site_id } = req.query;
  
  logger.log('Environment check');
  logger.log('OAUTH_GITHUB_CLIENT_ID exists:', !!process.env.OAUTH_GITHUB_CLIENT_ID);
  logger.log('Legacy GITHUB_CLIENT_ID exists:', !!process.env.GITHUB_CLIENT_ID);
  logger.log('Final GITHUB_CLIENT_ID exists:', !!GITHUB_CLIENT_ID);
  // Never log actual client IDs!
  logger.log('Site ID provided:', !!site_id);
  
  if (!GITHUB_CLIENT_ID) {
    logger.error('GITHUB_CLIENT_ID is not configured');
    res.status(500).json({ 
      error: 'GITHUB_CLIENT_ID is not configured',
      message: 'Please check your environment variables in Vercel dashboard'
    });
    return;
  }

  logger.log('Environment variables validated');

  // Build the GitHub OAuth URL with proper parameters - ensure no trailing slash
  const baseUrl = req.headers.host ? `https://${req.headers.host}` : 'https://jewelry-online.vercel.app';
  const redirectUri = `${baseUrl}/api/callback`;
  
  logger.log('Building OAuth URL');
  logger.log('Base URL ready');
  logger.log('Redirect URI configured');
  // Don't log client ID
  logger.log('OAuth scope configured');
  // Don't log state parameter
  
  const params = new URLSearchParams({
    client_id: GITHUB_CLIENT_ID,
    redirect_uri: redirectUri,
    scope: 'repo,user,read:user,user:email',
    state: site_id || 'default'
  });

  const redirectUrl = `https://github.com/login/oauth/authorize?${params.toString()}`;
  // Never log full OAuth URLs - they contain sensitive params
  logger.log('Redirecting to GitHub OAuth');
  
  res.redirect(302, redirectUrl);
}; 