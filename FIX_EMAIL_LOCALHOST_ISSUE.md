# Fix Email Links Showing localhost:3000 on Mobile

## Problem
Email confirmation and password reset links are showing `localhost:3000` in the URL when opened on mobile devices, causing "This site can't be reached" errors.

## Root Cause
1. **Old emails**: Emails sent before the fix was deployed still contain `localhost:3000` URLs
2. **Environment variables**: `NEXT_PUBLIC_BASE_URL` might not be set in Vercel
3. **Supabase redirect URLs**: Supabase might have localhost URLs configured in its settings

## Solutions

### 1. Set Environment Variable in Vercel (IMPORTANT)

**Go to Vercel Dashboard:**
1. Go to: https://vercel.com/dashboard
2. Select your project: `smart-notes`
3. Go to: **Settings** → **Environment Variables**
4. Add/Update:
   - **Name**: `NEXT_PUBLIC_BASE_URL`
   - **Value**: `https://smart-notes-olive-alpha.vercel.app`
   - **Environment**: Select **Production, Preview, Development**
5. **Save** and **Redeploy**

### 2. Check Supabase Redirect URLs

**Go to Supabase Dashboard:**
1. Go to: https://supabase.com/dashboard
2. Select your project
3. Go to: **Authentication** → **URL Configuration**
4. Check **Redirect URLs** section
5. Make sure these URLs are added:
   - `https://smart-notes-olive-alpha.vercel.app/auth/confirm`
   - `https://smart-notes-olive-alpha.vercel.app/reset-password`
   - `https://smart-notes-olive-alpha.vercel.app/**`
6. **Remove** any localhost URLs (or keep them only for development)
7. **Save**

### 3. Check Site URL in Supabase

**In Supabase Dashboard:**
1. Go to: **Authentication** → **URL Configuration**
2. Check **Site URL** field
3. Should be: `https://smart-notes-olive-alpha.vercel.app`
4. **Save** if changed

### 4. Request New Emails

**After fixing the above:**
1. **For password reset**: Request a new password reset email (the new email will have the correct URL)
2. **For email confirmation**: Use the "Resend confirmation email" button (the new email will have the correct URL)

### 5. Verify the Fix

**Test the fix:**
1. Request a new password reset email
2. Check the email link - it should show `https://smart-notes-olive-alpha.vercel.app` not `localhost:3000`
3. Open the link on your mobile device - it should work

## Code Changes Made

The code has been updated to:
1. **Never use localhost in production** - always use production URL as fallback
2. **Use `window.location.origin` in client-side code** - automatically uses the correct domain
3. **Check multiple environment variables** - `NEXT_PUBLIC_BASE_URL`, `VERCEL_URL`, then production fallback

## Important Notes

- **Old emails will still have localhost URLs** - users need to request new emails
- **Environment variable must be set in Vercel** - otherwise the fallback logic is used
- **Supabase redirect URLs must include production URL** - otherwise Supabase might override the redirect URL

## Next Steps

1. ✅ Set `NEXT_PUBLIC_BASE_URL` in Vercel
2. ✅ Update Supabase redirect URLs
3. ✅ Redeploy the application
4. ✅ Request new test emails
5. ✅ Verify emails work on mobile

## Troubleshooting

**If emails still show localhost:**
1. Check Vercel environment variables are set correctly
2. Check Supabase redirect URLs include production URL
3. Make sure the code has been deployed (check latest deployment)
4. Request a new email after deployment

**If emails work on PC but not mobile:**
1. Check the email link URL in the email client
2. The link should show the production URL, not localhost
3. If it shows localhost, the email was sent before the fix

**If the code fix doesn't work:**
1. Check Vercel logs for errors
2. Verify environment variables are accessible
3. Check Supabase logs for redirect URL issues

