# PostgreSQL Setup

Use PostgreSQL for the real business site. This project already reads and writes orders, reviews, inventory, promos, products, and metal rates through the database layer.

## What PostgreSQL is used for

- Order storage
- Product inventory
- Promo codes
- Reviews
- Metal rates
- Database-backed product entries

## Required environment variables

Create a local `.env` file from [.env.example](/f:/Web%20Dev/Gold%20Shop/.env.example) and set these first:

```env
APP_URL=http://localhost:5173
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DATABASE?sslmode=require
ADMIN_SECRET_KEY=change-this-admin-key
```

## Recommended providers

- Neon
- Supabase
- Railway Postgres
- Render Postgres

Any standard PostgreSQL connection string works as long as it is exposed as `DATABASE_URL`.

## How this project initializes the database

You do not need to run manual SQL migrations first for the current app setup.

The schema is created automatically on first database use in [db.js](/f:/Web%20Dev/Gold%20Shop/lib/db.js). That includes:

- `orders`
- `reviews`
- `promos`
- `product_inventory`
- `metal_rates`
- `abandoned_carts`
- `products`

## Local setup steps

1. Copy `.env.example` to `.env`.
2. Set `DATABASE_URL` to your PostgreSQL connection string.
3. Set `ADMIN_SECRET_KEY` to a strong private value.
4. Run `npm install`.
5. Run `npm run dev`.
6. Open `http://localhost:5173/aj-store-portal-x7`.
7. Use your admin key in the dashboard.
8. Go to the `Metal Rates` tab and save positive values for `pricePerGram` and `baselinePricePerGram`.

## First verification

After saving rates, verify these URLs:

- `http://localhost:5173/api/rates`
- `http://localhost:5173/rates`
- one live-priced product page such as `http://localhost:5173/products/BR004`

## Important production notes

- Without `DATABASE_URL`, rates do not persist.
- Without `ADMIN_SECRET_KEY`, admin write actions fail.
- For production hosting, set these same environment variables in your hosting dashboard.
- If you use Vercel, use a hosted PostgreSQL provider such as Neon or Supabase and paste the full connection string into `DATABASE_URL`.

## Minimum production checklist

1. `DATABASE_URL` configured
2. `ADMIN_SECRET_KEY` configured
3. Payment secrets configured if using eSewa or Khalti
4. Admin dashboard can save metal rates
5. `/api/rates` returns active values
6. Checkout and order creation succeed against the database
