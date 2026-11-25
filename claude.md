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
- CMS/Admin: Decap CMS, local only (`npm run cms`, files in `cms/`); orders/rates at `/admin-dashboard`
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
- 2026-11-18: redesign step 3 (listing): `/collections` and `/collections/:category` (`pages/collection.tsx`), price + sort in the query string; desktop sticky sidebar filters, phone sticky toolbar + filter/sort bottom sheets; "Not online yet" for empty categories. Old `/shop-by/category/:id` redirects; category facet and the step-2 `all` stopgap removed from the gift guide; budget links use `/collections?price=`.
- 2026-11-18: redesign step 4 (product page): `ProductGallery` (thumbs, swipe, hover magnifier on fine pointers, lightbox with tap zoom), info column + sticky phone buy bar. Ring sizes 6-9 + "not-sure" from `client/src/lib/ring-sizes.ts` (mirrored in `lib/order-pricing.js`): required on the product page, cart lines keyed by id+size, sent to the API, shown in cart/checkout/WhatsApp/admin/order tracking; server validates and checks stock on the total per product; ring cards say "Choose size". Gift choice shared via cart context. CMS reviews no longer auto-`verified`; review photos hidden when they are product shots; 925 claims only on silver pieces.
- 2026-11-18: redesign step 5 (bag + checkout): new `CartSheet` (free-delivery bar, stepper, gift checkbox, prefilled WhatsApp order link); checkout rebuilt with `CheckoutHeader` (no nav/footer), Contact / Delivery (city list + Other) / Payment / Gift cards, collapsible summary + sticky Place order bar below 1024px (`lg` is the two-column breakpoint). Payment options limited to WhatsApp + COD (`PAYMENT_OPTIONS`) until eSewa/Khalti/FonePay are configured. Email field and unused Mapbox locate removed. Gift "is a gift" is read from cart context. Redesign complete.
- 2026-11-18: `aashish.website` no longer resolves (expired); site URL switched to `https://jewelry-online.vercel.app` via exported `SITE_URL` in `client/src/components/SiteMeta.tsx` (sitemap, robots.txt and CMS config.yml keep copies). CMS login also needs the GitHub OAuth app callback updated to the new URL. `og:url` now follows the current page.
- 2026-11-18: daily metal rates: `lib/nepal-rates.js` reads FENEGOSIDA's website feed (api.fenegosida.org Dashboard/today, undocumented), cross-checks per-10g vs per-tola, sane ranges, refuses >15% daily jumps, saves current rate per purity (925 silver, 18/22/24K) without touching baseline. Runs via Vercel Cron (`vercel.json` crons, 05:30 UTC) at `/api/metal-rates/sync` (needs `CRON_SECRET` env) or the admin "Fetch today's rate now" button; admin can also enter per-tola rates. Database (Neon) still required.
- 2026-11-18: moved hosting to a new Vercel project `aashish-jewellers` (account aadarshagautam) at https://aashish-jewellers.vercel.app with a free Neon Postgres in Singapore (`aashish-jewellers-db`), ADMIN_SECRET_KEY and CRON_SECRET set; functions pinned to sin1. The old jewelry-online.vercel.app project (owner account aashisho1o1s, broken Railway DB) is no longer used. The new project is not Git-connected (repo owned by Aashisho1o1): deploy with `vercel deploy --prod` from this folder.
- 2026-11-24: CMS made local-only: moved to `cms/`, served by Vite dev at `/admin/` with `decap-server`; public `/admin` routes and the GitHub OAuth endpoints removed. `aashishjewellers.com.np` is Active at the registrar and attached in Vercel, but not yet in the com.np zone.
- 2026-11-24: `priceMode: formula` (rate x weight + wastage % + making charge + stones; `calculateFormulaPrice` in `lib/metal-pricing.js`, shared with the CMS `sell-price` widget; charges never sent to customers; saved `price` is the fallback). Product frontmatter now parsed with js-yaml because Decap wraps long lines. CMS product form simplified, Delete off.
- 2026-11-24: `aashishjewellers.com.np` is live and is the site URL; `www` redirects to it (not `/api/`, so callbacks and cron are never redirected). The `aashish-jewellers.vercel.app` redirect waits until every com.np nameserver lists the domain. Default share image switched to a real file (`/icons` does not exist).
- 2026-11-24: CMS "Go Live" button (`cms/go-live.js`, `scripts/go-live.js`, Vite dev endpoints `/admin/go-live/*`, localhost only): content-only commits go straight to `main` (owner approved) and deploy from a clean worktree with the Vercel CLI; big price changes/removals need confirmation; undo reverts the last one. The GitHub repo is public, so product files (including wastage and making charges) are visible there.
- 2026-11-25: order details: `lib/order-lines.ts` writes items (code, size, qty, link) for WhatsApp; dashboard orders are `components/admin/OrderCard.tsx` cards with photos, codes, gift details, customer WhatsApp and a packing slip. WhatsApp checkout saves first, then order-success shows an "Open WhatsApp" button; a failed save keeps the bag.
- 2026-11-25: `live_metal` is now "Follows rate": each product stores `priceBaseRate` / `price_base_rate` (rate when its price was typed), replacing the shared baseline; only the movement is rounded. The 5 existing live_metal products start at silver 241.10. Rates API refuses a >15% manual change without `confirmBigChange`; owner can accept a big FENEGOSIDA jump; the rates screen lists which prices changed.
- 2026-11-25: free-limit protection: `lib/cdn-cache.js` keeps products/rates/flash sale/reviews on Vercel's CDN up to 1h (tagged; admin saves and the rate sync purge at once; never cached when a loader fell back, past a sale end, or with a query string). Checkout uses `?fresh=`. Admin "Download backup" = `/api/orders/backup`. Vercel Hobby terms are personal/non-commercial only: needs Pro (or another host) before real selling.
- 2026-11-25: install pop-up removed at the owner's request (customers use the website in a browser).
- 2026-11-25: owner logo added (`client/public/icons/`: favicon crop, app icons, `share.png` for link previews); missing image URLs now return 404 instead of the homepage.
- 2026-11-25: product codes are unique: CMS `product-code` widget (suggests next free, refuses taken, locked after save), Go Live refuses duplicates (folder and live shop), admin create returns 409 for a CMS code. Decap lowercases new file names, so Go Live accepts either case.
- 2026-11-25: "option B" (products in the admin dashboard), step 1: `components/admin/ProductsTab.tsx` + `lib/product-admin.js` (server validation, automatic codes, fixed/formula price, draft/live/hidden, >30% price change needs confirm, stock); delete endpoint removed (hide instead); DB products now in the sitemap. Next: step 2 photo upload, step 3 move the CMS products.
- Open: Rate limiting and admin brute-force lock are in-memory per serverless instance.
