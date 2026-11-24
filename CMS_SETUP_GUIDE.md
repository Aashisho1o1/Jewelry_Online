# Editing products and content (local CMS)

The CMS runs only on your computer. It is not on the public website and needs no GitHub login.

1. Double-click `Start CMS.cmd` (or run `npm.cmd run cms`).
2. Open http://localhost:5173/admin/ and press Login (no password).
3. Edit and press Publish. This saves files in this folder only.
4. Check the result at http://localhost:5173.
5. To go live: commit the changed files in `content/`, `client/src/content/` and `client/public/images/jewelry/`, then deploy.

Stop with Ctrl+C. Orders, stock, rates and promos are managed online at `/admin-dashboard`, not here.

## Prices

- **Fixed price:** type the sell price.
- **Calculated:** (rate per gram x weight) + wastage % + making charge + stone cost, rounded to NPR 10. The website recalculates it with the daily rate; if no rate is available it uses the last price saved in the CMS. Wastage and a % making charge are both taken on the metal value. No VAT or luxury tax is added.

The CMS helper on port 8081 has no password. It only accepts connections from this computer; keep it that way.
