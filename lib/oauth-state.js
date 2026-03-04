import crypto from 'crypto';

const OAUTH_STATE_TTL_MS = 10 * 60 * 1000;

function toBase64Url(value) {
  return Buffer.from(value)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function fromBase64Url(value) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padding = (4 - (normalized.length % 4)) % 4;
  return Buffer.from(`${normalized}${'='.repeat(padding)}`, 'base64').toString('utf-8');
}

function getOAuthStateSecret() {
  return process.env.OAUTH_STATE_SECRET
    || process.env.OAUTH_GITHUB_CLIENT_SECRET
    || process.env.GITHUB_CLIENT_SECRET;
}

function createSignature(encodedPayload, secret) {
  return crypto
    .createHmac('sha256', secret)
    .update(encodedPayload)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function normalizeOrigin(origin) {
  const parsed = new URL(origin);
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error('Invalid OAuth origin protocol');
  }

  return parsed.origin;
}

function signaturesMatch(received, expected) {
  const receivedBuffer = Buffer.from(received);
  const expectedBuffer = Buffer.from(expected);

  if (receivedBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(receivedBuffer, expectedBuffer);
}

export function createOAuthState({ origin, siteId = 'default' }) {
  const secret = getOAuthStateSecret();
  if (!secret) {
    throw new Error('OAuth state secret is not configured');
  }

  const payload = {
    origin: normalizeOrigin(origin),
    siteId,
    issuedAt: Date.now(),
  };

  const encodedPayload = toBase64Url(JSON.stringify(payload));
  const signature = createSignature(encodedPayload, secret);

  return `${encodedPayload}.${signature}`;
}

export function verifyOAuthState(rawState) {
  if (!rawState || typeof rawState !== 'string') {
    throw new Error('Missing OAuth state');
  }

  const [encodedPayload, signature, ...rest] = rawState.split('.');
  if (!encodedPayload || !signature || rest.length > 0) {
    throw new Error('Invalid OAuth state format');
  }

  const secret = getOAuthStateSecret();
  if (!secret) {
    throw new Error('OAuth state secret is not configured');
  }

  const expectedSignature = createSignature(encodedPayload, secret);
  if (!signaturesMatch(signature, expectedSignature)) {
    throw new Error('Invalid OAuth state signature');
  }

  let payload;
  try {
    payload = JSON.parse(fromBase64Url(encodedPayload));
  } catch {
    throw new Error('Invalid OAuth state payload');
  }

  const issuedAt = Number(payload.issuedAt);
  if (!Number.isFinite(issuedAt)) {
    throw new Error('Invalid OAuth state timestamp');
  }

  if ((Date.now() - issuedAt) > OAUTH_STATE_TTL_MS) {
    throw new Error('OAuth state expired');
  }

  return {
    origin: normalizeOrigin(payload.origin),
    siteId: typeof payload.siteId === 'string' && payload.siteId ? payload.siteId : 'default',
    issuedAt,
  };
}
