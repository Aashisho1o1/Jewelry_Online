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
- Current working branch: `v1-Aashish`
- Base branch for this work: `v1`

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
