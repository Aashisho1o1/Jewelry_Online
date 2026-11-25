// Vercel's network keeps public shop data so visits don't keep the free database awake.
// Saving in the admin dashboard clears it at once; the time limit is only a safety net.
import { dangerouslyDeleteByTag } from '@vercel/functions';

export const CACHE_SECONDS = 3600;

/** Only for successful, complete public responses. A query string (?fresh=...) always skips the cache. */
export function cacheUntilChanged(req, res, tag, { maxSeconds = CACHE_SECONDS, allowQuery = false } = {}) {
  const seconds = Math.floor(Math.min(CACHE_SECONDS, maxSeconds));
  if (seconds < 5 || (!allowQuery && String(req.url || '').includes('?'))) {
    res.setHeader('Cache-Control', 'no-store');
    return;
  }
  // Browsers always check back, so a price change reaches open phones too.
  res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
  res.setHeader('Vercel-CDN-Cache-Control', `public, max-age=${seconds}`);
  res.setHeader('Vercel-Cache-Tag', tag);
}

/** Never fails the save it follows: without it, the data just refreshes within the hour. */
export async function clearCache(...tags) {
  if (!process.env.VERCEL) return;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      await dangerouslyDeleteByTag(tags, { revalidationDeadlineSeconds: 0 });
      return;
    } catch (error) {
      console.error('[cache] clear failed:', error.message);
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
}
