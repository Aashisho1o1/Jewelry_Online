import logger from '../lib/logger.js';
import { createOAuthState } from '../lib/oauth-state.js';

function getRequestOrigin(req) {
  const forwardedProto = String(req.headers['x-forwarded-proto'] || '').split(',')[0].trim();
  const forwardedHost = String(req.headers['x-forwarded-host'] || '').split(',')[0].trim();
  const host = forwardedHost || req.headers.host || process.env.VERCEL_URL || 'jewelry-online.vercel.app';
  const protocol = forwardedProto || (String(host).includes('localhost') ? 'http' : 'https');
  return new URL(`${protocol}://${host}`).origin;
}

export default (req, res) => {
  logger.log('Auth endpoint called');
  logger.log('Request method:', req.method);

  const GITHUB_CLIENT_ID = process.env.OAUTH_GITHUB_CLIENT_ID || process.env.GITHUB_CLIENT_ID;
  const GITHUB_CLIENT_SECRET = process.env.OAUTH_GITHUB_CLIENT_SECRET || process.env.GITHUB_CLIENT_SECRET;
  const { site_id } = req.query;

  if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET) {
    logger.error('GitHub OAuth credentials are not configured');
    res.status(500).json({
      error: 'GitHub OAuth credentials are not configured',
      message: 'Please check your environment variables in Vercel dashboard',
    });
    return;
  }

  try {
    const origin = getRequestOrigin(req);
    const redirectUri = `${origin}/api/callback`;
    const state = createOAuthState({
      origin,
      siteId: site_id || 'default',
    });

    const params = new URLSearchParams({
      client_id: GITHUB_CLIENT_ID,
      redirect_uri: redirectUri,
      scope: 'repo,user,read:user,user:email',
      state,
    });

    res.redirect(302, `https://github.com/login/oauth/authorize?${params.toString()}`);
  } catch (error) {
    logger.error('Failed to build OAuth redirect:', error);
    res.status(500).json({
      error: 'Failed to start OAuth flow',
      message: 'Please try again.',
    });
  }
};
