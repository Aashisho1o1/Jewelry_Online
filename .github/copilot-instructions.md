# Copilot Instructions for Aashish Jewellers E-commerce

## Project Architecture

This is a **monolithic Vite + React SPA** deployed to **Vercel** with serverless API routes. The app serves Nepal's jewelry e-commerce market with localized payment gateways (eSewa, Khalti, FonePay).

### Critical Directory Structure
- `client/src/` - React TypeScript frontend (Vite root: `client/`)
- `api/` - Vercel serverless functions (Node.js, not TypeScript)
- `content/jewelry/` - Markdown product catalog (managed via Decap CMS)
- `lib/` - Shared utilities (database, rate limiting, validation)
- `public/images/jewelry/` - Product images (stored in Git, NOT CDN)

### Data Flow: Content → Frontend
1. **CMS**: Decap CMS (`client/public/admin/`) writes Markdown files to `content/jewelry/*.md`
2. **Build**: `product-loader.ts` parses frontmatter from `content/jewelry/` using `markdown-parser.ts`
3. **Runtime**: Products load client-side from parsed frontmatter (NO database for products)
4. **Images**: All paths MUST resolve to `/images/jewelry/*` (served from `public/`)

**CRITICAL**: Product images are Git-committed assets in `public/images/jewelry/`, NOT external URLs. When handling image paths, normalize them in `product-loader.ts` to `/images/jewelry/*` format.

## Database Architecture

**Railway PostgreSQL** for orders only (products are file-based).

- **Connection**: `lib/db.js` uses `pg.Pool` with SSL, 5 max connections, 30s idle timeout
- **Schema**: Auto-initialized on first query (see `initializeSchema()` in `lib/db.js`)
- **Tables**: `orders` (id, items JSONB, customer JSONB, total, payment_method, status, created_at)
- **Query Pattern**: `lib/db-store.js` wraps common operations (`createOrder`, `getOrder`, `updateOrderStatus`)

**Key Conventions**:
- Always use parameterized queries: `query($1, $2, ...)` to prevent SQL injection
- JSON fields (items, customer) are auto-parsed by `db-store.js` helpers
- Order IDs: `ORD-{timestamp}-{random}` format generated in `createOrder()`

## Payment Gateway Integration

**Three localized gateways**: eSewa (dominant), Khalti, FonePay QR (manual verification).

### eSewa v2 Flow
1. **POST** `/api/payments/esewa/create` → Generate transaction UUID, calculate `total_amount` (must equal `amount + tax + service + delivery`)
2. Client submits form to `https://rc-epay.esewa.com.np/api/epay/main/v2/form` with signature
3. **Callback**: `/api/payments/esewa/callback` → Verify signature, update order status to `paid`

**Critical**: eSewa `signature` = base64(sha256(`total_amount,transaction_uuid,product_code`)) using `ESEWA_SECRET_KEY`.

### Khalti v2 Flow
1. **POST** `/api/payments/khalti/create` → Get `pidx` from Khalti API
2. Redirect user to `payment_url`
3. **POST** `/api/payments/khalti/verify` → Verify `pidx`, mark order `paid`

### FonePay QR (Manual)
- Displays static QR code from `/images/fonepay-qr-code.jpg` (see `FonePayQRModal.tsx`)
- Order ID shown to user for manual reconciliation
- No automatic verification (merchant manually marks orders paid)

## Authentication: Decap CMS + GitHub OAuth

**OAuth Flow** (for CMS access only):
1. `/api/auth` → Redirects to GitHub OAuth (`OAUTH_GITHUB_CLIENT_ID`)
2. `/api/callback` → Exchanges code for `access_token`, returns postMessage to CMS
3. CMS uses token to commit to `Aashisho1o1/Jewelry_Online` via GitHub API

**Environment Variables** (Vercel dashboard):
- `OAUTH_GITHUB_CLIENT_ID`, `OAUTH_GITHUB_CLIENT_SECRET` - OAuth app credentials
- `GITHUB_TOKEN` - Personal Access Token for CMS backend (`repo`, `user:email` scopes)
- `GITHUB_OWNER=Aashisho1o1`, `GITHUB_REPO=Jewelry_Online`
- `DATABASE_URL` - Railway Postgres connection string
- `ESEWA_MERCHANT_ID`, `ESEWA_SECRET_KEY`, `KHALTI_SECRET_KEY`

**CRITICAL**: OAuth callback URL must match `https://www.aashish.website/api/callback` in GitHub app settings.

## Development Workflow

### Local Development
```bash
npm install
npm run dev  # Vite on http://localhost:5173
```

### Decap CMS Local Development
```bash
npm run cms:local  # Start netlify-cms-proxy-server on :8081
```
Then visit `http://localhost:5173/admin` and use local Git backend.

### Deployment
- **Platform**: Vercel (production at `www.aashish.website`)
- **Build**: `npm run build` → outputs to `dist/` (Vite root is `client/`)
- **Routes**: See `vercel.json` for API rewrites (`/api/*` → `/api/*.js` serverless functions)

### Testing Payments
- **eSewa**: Use sandbox merchant code from `ESEWA_MERCHANT_ID` env var
- **Khalti**: Test mode enabled via `KHALTI_SECRET_KEY` (test-prefixed)
- **FonePay**: Replace QR code at `/images/fonepay-qr-code.jpg` for production

## Project-Specific Conventions

### File Naming
- **API routes**: Lowercase with hyphens (`payments/esewa/callback.js`)
- **React components**: PascalCase (`ProductCard.tsx`, `FonePayQRModal.tsx`)
- **Types**: Lowercase (`jewelry.ts`, `cart.ts`, `order.ts`)
- **Utilities**: Lowercase (`markdown-parser.ts`, `security.ts`)

### Code Style
- **API functions**: CommonJS-style exports (`export default async function handler(req, res)`)
- **Frontend**: ES6 modules, TypeScript strict mode
- **Logging**: Emoji prefixes for visibility (`🛒 Order created`, `❌ Payment failed`, `✅ Success`)

### Security Patterns
- **Rate Limiting**: `lib/rate-limiter.js` (in-memory, 10 req/min default) - wrap sensitive API routes
- **Validation**: `lib/validator.js` provides `validateOrder()`, `validateCustomer()` helpers
- **SQL Injection**: ALWAYS use parameterized queries via `lib/db.js`
- **XSS**: React auto-escapes by default; use `sanitizeHtml()` from `utils/security.ts` for user-generated content

### Error Handling
- **API**: Return JSON with `{ error: "message" }` and appropriate status codes
- **Frontend**: `ErrorBoundary.tsx` catches React errors, displays fallback UI
- **Database**: Log errors with `console.error()` and emoji prefix (`❌`)

## Common Pitfalls

1. **Image Paths**: Products MUST use `/images/jewelry/*` paths, not relative or external URLs
2. **Vite Root**: Build config expects `client/` as root; don't reference `client/` in import paths
3. **API Routes**: Vercel functions are Node.js (`.js`), not TypeScript; no `tsx` imports
4. **eSewa Total Mismatch**: `total_amount` MUST equal sum of all components or payment fails
5. **CMS Auth**: Requires both OAuth app AND personal access token in env vars
6. **Database Connection**: Railway requires SSL; pool is lazily initialized on first query

## Key Files to Reference

- **Product loading**: `client/src/data/product-loader.ts` (frontmatter parsing)
- **Database operations**: `lib/db-store.js` (order CRUD)
- **Payment signatures**: `api/payments/esewa/create.js` (eSewa v2 signature calculation)
- **CMS config**: `client/public/admin/config.yml` (Decap CMS schema)
- **Type definitions**: `client/src/types/jewelry.ts` (minimal product schema)

Also, always refer to the current codes in the codebase for the most accurate and up-to-date details because the codebase might have been changed directly without updating this instruction file.