# Editing products and content (local CMS)

The CMS runs only on your computer. It is not on the public website and needs no GitHub login.

1. Double-click `Start CMS.cmd` (or run `npm.cmd run cms`).
2. Open http://localhost:5173/admin/ and press Login (no password).
3. Edit and press Publish. This saves files in this folder only.
4. Check the result at http://localhost:5173.
5. Press **Go Live** (bottom right), check the list, then **Go Live now**. It checks the content, commits it to `main` and deploys. **Undo last update** puts the previous version back. Code changes are refused; those need a PR.

Stop with Ctrl+C. Orders, stock, rates and promos are managed online at `/admin-dashboard`, not here.

## Weight

Type weight in laal (100 laal = 1 tola = 11.664 g). It is saved in grams, and customers see both, e.g. "100 laal (11.664 g)".

## Prices

- **Fixed price:** type the sell price.
- **Follows rate:** type today's sell price. The website moves it by (rate now - rate when you typed it) x weight, rounded to NPR 10.
- **Built from rate:** (rate per gram x weight) + wastage % + making charge + stone cost, rounded to NPR 10. The website recalculates it with the daily rate; if no rate is available it uses the last price saved in the CMS. Wastage and a % making charge are both taken on the metal value. No VAT or luxury tax is added.

The CMS helper on port 8081 has no password. It only accepts connections from this computer; keep it that way.
