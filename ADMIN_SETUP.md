# Admin Interface Setup

## Step 1: Create GitHub Personal Access Token

1. Go to [GitHub Settings > Personal Access Tokens](https://github.com/settings/tokens)
2. Click "Generate new token" > "Generate new token (classic)"
3. Give it a name like "Landscape Website Admin"
4. Set expiration to "No expiration" or 1 year
5. Select these permissions:
   - ✅ **repo** (Full control of private repositories)
6. Click "Generate token"
7. **IMPORTANT**: Copy the token immediately (you won't see it again)

## Step 2: Add Environment Variables to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Find your project "landscape-design-aashisho1o1s-projects"
3. Go to Settings > Environment Variables
4. Add these variables:

| Name | Value |
|------|-------|
| `GITHUB_TOKEN` | Your personal access token from Step 1 |
| `GITHUB_OWNER` | `Aashisho1o1` |
| `GITHUB_REPO` | `Landscape-Design` |

5. Make sure to set them for **Production**, **Preview**, and **Development**
6. Click "Save"

## Step 3: Redeploy

1. Go to the Deployments tab in Vercel
2. Click the three dots on the latest deployment
3. Click "Redeploy"

## How It Works

Once set up, your friend can:
1. Visit `/admin` on the website
2. Edit content using the forms
3. Click "Save" buttons
4. Changes are automatically committed to GitHub
5. Vercel automatically redeploys the site with new content

## Security Notes

- The GitHub token only has access to this specific repository
- The admin interface is publicly accessible but requires no login
- Consider adding basic authentication if needed
- The token can be revoked anytime from GitHub settings

## Troubleshooting

If saving doesn't work:
1. Check that environment variables are set correctly in Vercel
2. Verify the GitHub token has `repo` permissions
3. Check the Vercel function logs for errors
4. Make sure the repository name and owner are correct 