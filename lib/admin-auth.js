/**
 * Admin authentication with brute-force protection.
 * - Checks x-admin-key header against ADMIN_SECRET_KEY env var
 * - Blocks an IP after 5 failed attempts for 30 minutes
 */

// In-memory brute force tracker (resets on server restart, fine for serverless)
const failedAttempts = new Map(); // ip -> { count, blockedUntil }

const MAX_ATTEMPTS = 5;
const BLOCK_DURATION_MS = 30 * 60 * 1000; // 30 minutes
const WINDOW_MS = 10 * 60 * 1000;         // 10-minute rolling window

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.connection?.remoteAddress || req.socket?.remoteAddress || 'unknown';
}

function isBlocked(ip) {
  const record = failedAttempts.get(ip);
  if (!record) return false;
  if (record.blockedUntil && Date.now() < record.blockedUntil) return true;
  // Block expired - clear it
  if (record.blockedUntil && Date.now() >= record.blockedUntil) {
    failedAttempts.delete(ip);
  }
  return false;
}

function recordFailure(ip) {
  const now = Date.now();
  const record = failedAttempts.get(ip) || { count: 0, firstAttempt: now, blockedUntil: null };

  // Reset window if first attempt was more than WINDOW_MS ago
  if (now - record.firstAttempt > WINDOW_MS) {
    record.count = 0;
    record.firstAttempt = now;
    record.blockedUntil = null;
  }

  record.count += 1;

  if (record.count >= MAX_ATTEMPTS) {
    record.blockedUntil = now + BLOCK_DURATION_MS;
  }

  failedAttempts.set(ip, record);
}

function recordSuccess(ip) {
  failedAttempts.delete(ip);
}

export function requireAdminAuth(req, res) {
  const adminKey = process.env.ADMIN_SECRET_KEY;

  if (!adminKey) {
    console.error('ADMIN_SECRET_KEY environment variable is not set');
    res.status(503).json({ error: 'Admin authentication not configured' });
    return false;
  }

  const ip = getClientIp(req);

  if (isBlocked(ip)) {
    res.status(429).json({ error: 'Too many failed attempts. Try again in 30 minutes.' });
    return false;
  }

  const providedKey = req.headers['x-admin-key'];

  if (!providedKey || providedKey !== adminKey) {
    recordFailure(ip);
    const record = failedAttempts.get(ip);
    const remaining = MAX_ATTEMPTS - (record?.count || 0);
    res.status(401).json({
      error: 'Unauthorized',
      attemptsRemaining: Math.max(0, remaining),
    });
    return false;
  }

  recordSuccess(ip);
  return true;
}
