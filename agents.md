# Project Memory

Sync rule: keep `agents.md` and `claude.md` identical. Update both in the same change.

## Goal

- Launch a public MVP of the `Jewelry_Online` store in about 7 days.
- Focus on realistic security, stability, and maintainability issues before public sharing.
- Keep fixes small, understandable, and easy to explain in code review.

## Vision

- A lean jewelry storefront with product browsing, checkout, order tracking, admin operations, and CMS-managed content.
- Ship a dependable MVP first. Avoid clever abstractions and broad refactors unless they remove real risk.

## User Preferences

- The user hates verbose, large code dumps from AI models.
- Keep explanations concise, accurate, and mentor-like.
- Prefer minimal, lean code additions or edits to fix issues.
- When adding comments, keep them short and explain why the change exists.

## Stack Snapshot

- Frontend: React + Vite + Wouter
- Backend: Vercel-style serverless handlers in `api/`
- Shared backend logic: `lib/`
- Database: PostgreSQL via `pg`
- CMS/Admin: Decap CMS under `/admin`
- Payments: eSewa, Khalti, FonePay, WhatsApp-assisted flows

## Main Repo Boundaries

- Real working repo: `/Users/aahishsunar/Desktop/Projects/AJ/Jewelry_Online`
- Ignore `/Users/aahishsunar/Desktop/Projects/AJ/Jewelry_Online_push` unless explicitly comparing an old backup copy.
- Current working branch: `design-ux-polish` (PR #19 into `main`)
- Base branch for this work: `main`

## Current Repo Notes

- The working tree has untracked image files under `client/public/images/jewelry`.
- Do not accidentally stage those image files during commits.
- Use targeted staging only for intended files.

## Current Priorities

1. Debug the MVP carefully and explain findings clearly.
2. Perform a deep code, architecture, and security review.
3. Fix the highest-risk launch issues with minimal diffs.
4. Keep repo memory updated so future sessions can continue cleanly.

## Known Hotspots

- `client/src/pages/admin-dashboard.tsx`
- `vite.config.ts`
- `lib/db-store.js`
- `api/upload-image.js`
- `api/auth.js`
- `api/callback.js`

## Editing Rules

- Prefer the smallest change that fully solves the issue.
- Keep comments concise and focused on why.
- Avoid large rewrites unless the current structure blocks a safe fix.
- Keep chat responses and code changes lean.
- Update both memory files together whenever project goals, branch workflow, or progress changes.

## Progress Log

- 2026-03-11: confirmed `Jewelry_Online_push` was a duplicate/backup repo, not part of the main app.
- 2026-03-11: moved `Jewelry_Online_push` outside the main repo root.
- 2026-03-11: created branch `v1-Aashish` from `v1` for ongoing work.
- 2026-03-11: started persistent project memory files for future sessions.
- 2026-03-11: fixed the first verified blocker by removing runtime use of `react-helmet-async`, which was declared but missing from `node_modules`.
- 2026-03-11: `npm run check` now passes again; `npm run build` still writes `dist/` but does not exit yet, so there is a second build-lifecycle issue still under investigation.
- 2026-03-11: deep security review found the main launch risks in public order access, public GitHub-backed image upload, browser-held admin/CMS secrets, stored XSS in admin print flow, weak rate limiting, and stock/order abuse paths.
- 2026-03-11: shipped the first security hardening pass: order lookup/history now require order ID plus phone, `/api/orders/create` is rate-limited and leaves orders pending until confirmation, payment limiter awaits were fixed, `/api/upload-image` was disabled, callback/admin print XSS sinks were tightened, and stock/promo side effects moved to first confirmation.
- 2026-10-29: `npm run build` exits cleanly now. Mobile UI polish; fixed checkout hooks crash after order and cart not clearing after redirect.
- 2026-11-18: opened PR #19. Security pass: Khalti verify now checks pidx + amount belong to the order; eSewa callback checks amount; payment callbacks only confirm pending orders; stock/promo side effects only leave `pending`; rate limiters no longer share one map (and `/api/products` limiter is awaited); eSewa form URL via `ESEWA_FORM_URL` (sandbox default); order customer payload capped; constant-time admin key compare.
- 2026-11-18: deps cleanup (removed unused zod packages, `npm audit fix`, Vite 7.3.8; remaining advisories are `picomatch` with no fix and local-only `netlify-cms-proxy-server`). Flash sale now applied server-side in `lib/catalog.js` (`price` discounted, `originalPrice` = pre-sale, `flashSalePercent`), so cards, cart, checkout and order validation agree.
- 2026-11-18: admin can close orders (`cancelled`/`refunded`/`failed`). Stock rule: taken when an order leaves `pending` (any open status), returned when a non-pending order is closed; closed orders can't be reopened or moved back to `pending`; status changes use a conditional UPDATE so concurrent requests can't adjust stock twice. Fixed admin "Shipped" filter tab (status is `dispatched`).
- 2026-11-18: storefront redesign (handoff "Aashish Store v2", forest-green palette) started in 5 steps. Step 1 (chrome): tailwind `forest`/`cream` tokens + `xl2` (1120px), top rate strip (`StoreRateStrip variant="topbar"`, hidden when rates fail), new sticky header, `MobileTabBar`, `CategorySheet` on `ui/bottom-sheet`, desktop `WhatsAppFab`, forest footer, `category` facet for `/shop-by/category/:id` (step 3 replaces with collection pages), heavy PNGs re-encoded as JPG (originals kept for any DB/CMS references). AI ChatWidget unmounted until GEMINI_API_KEY is set.
- 2026-11-18: redesign step 2 (home + product card): new ProductCard (pill discount, round wishlist, outline Add to bag pinned to bottom), home rebuilt with `HeroCarousel` (slides in `home.json`, pauses on hover/focus/touch, respects reduced motion, swipe) and `CategoryCircles`; phone/desktop section order via CSS `order`. Home catalog grid removed; "Shop All"/"View all" go to `/shop-by/category/all` until step 3 collection pages. Budget tiles keep the existing 2,500-based price buckets.
- Open: Rate limiting and admin brute-force lock are in-memory per serverless instance.
