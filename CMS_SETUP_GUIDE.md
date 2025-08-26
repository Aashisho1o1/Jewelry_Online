# Environment Variables Setup for CMS Image Persistence

## Critical Environment Variables Needed

### For Vercel Dashboard (Production)

Add these environment variables in your Vercel project settings:

1. **GITHUB_TOKEN** (or OAUTH_GITHUB_CLIENT_SECRET)
   - Value: Your GitHub Personal Access Token
   - Permissions needed: `repo`, `contents:write`, `user:email`
   - Generate at: https://github.com/settings/tokens

2. **OAUTH_GITHUB_CLIENT_ID** 
   - Value: Your GitHub OAuth App Client ID
   - Get from: https://github.com/settings/applications/new

3. **OAUTH_GITHUB_CLIENT_SECRET**
   - Value: Your GitHub OAuth App Client Secret
   - From the same OAuth app

4. **GITHUB_OWNER**
   - Value: `Aashisho1o1`

5. **GITHUB_REPO**
   - Value: `Jewelry_Online`

### GitHub OAuth App Setup

1. Go to: https://github.com/settings/applications/new

2. Fill in:
   - Application name: `Aashish Jewellers CMS`
   - Homepage URL: `https://www.aashish.website`
   - Authorization callback URL: `https://www.aashish.website/api/callback`

3. Save the Client ID and Client Secret to Vercel environment variables

### GitHub Personal Access Token

1. Go to: https://github.com/settings/tokens

2. Click "Generate new token (classic)"

3. Select scopes:
   - ✅ `repo` (Full control of private repositories)
   - ✅ `user:email` (Access user email addresses)

4. Copy the token and add to Vercel as `GITHUB_TOKEN`

## Testing the Setup

After adding environment variables:

1. Redeploy your Vercel app
2. Go to `/admin` 
3. Try to authenticate with GitHub
4. Upload a test image through CMS
5. Check if the image persists after redeployment

## Troubleshooting

### Images Still Disappearing?
- Check Vercel environment variables are set
- Verify GitHub token has `contents:write` permission
- Ensure CMS config uses correct `media_folder` path

### CMS Authentication Issues?
- Verify OAuth app callback URL matches exactly
- Check Client ID/Secret are correctly set in Vercel
- Try clearing browser cache and localStorage

### API Errors?
- Check Vercel function logs for error messages
- Verify GitHub token hasn't expired
- Ensure repository name/owner are correct

## Files Modified for the Fix

1. `client/public/admin/config.yml` - Fixed media folder path
2. `client/src/data/product-loader.ts` - Image path normalization
3. `api/products.js` - Image path handling
4. `api/upload-image.js` - New GitHub upload endpoint
5. `public/sw.js` - Prevent image caching issues
6. `content/jewelry/*.md` - Fixed image references

## Next Steps

1. Set up environment variables in Vercel
2. Commit and push all changes
3. Test CMS functionality
4. Monitor for image persistence after deployments
