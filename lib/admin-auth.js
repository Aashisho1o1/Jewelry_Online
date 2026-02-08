/**
 * Simple admin authentication for order management APIs.
 * Checks for ADMIN_API_KEY via x-admin-key header.
 *
 * Set ADMIN_API_KEY in your Vercel environment variables.
 */

export function requireAdminAuth(req, res) {
  const adminKey = process.env.ADMIN_API_KEY;

  if (!adminKey) {
    console.error('ADMIN_API_KEY environment variable is not set');
    res.status(503).json({ error: 'Admin authentication not configured' });
    return false;
  }

  const providedKey = req.headers['x-admin-key'];

  if (!providedKey || providedKey !== adminKey) {
    res.status(401).json({ error: 'Unauthorized' });
    return false;
  }

  return true;
}
