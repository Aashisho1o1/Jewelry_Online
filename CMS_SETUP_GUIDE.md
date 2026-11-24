# Editing products and content (local CMS)

The CMS runs only on your computer. It is not on the public website and needs no GitHub login.

1. In the project folder, run `npm run cms`.
2. Open http://localhost:5173/admin/ and press Login (no password).
3. Edit and press Publish. This saves files in this folder only.
4. Check the result at http://localhost:5173.
5. To go live: commit the changed files in `content/`, `client/src/content/` and `client/public/images/jewelry/`, then deploy.

Stop with Ctrl+C. Orders, stock, rates and promos are managed online at `/admin-dashboard`, not here.

The CMS helper on port 8081 has no password. It only accepts connections from this computer; keep it that way.
