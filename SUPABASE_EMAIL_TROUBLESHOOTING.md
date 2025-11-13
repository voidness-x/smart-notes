# Supabase Email Troubleshooting Guide

## Problem: User signed up but didn't receive confirmation email

If a user appears in your database but didn't receive a confirmation email, follow these steps:

### 1. Check Supabase Email Settings

Go to your Supabase Dashboard → **Authentication** → **Email Templates** or **Settings**:

#### Email Provider Configuration
- **Free Tier**: Supabase uses their built-in email service (limited to 3 emails/hour)
- **Paid Tier**: You can configure custom SMTP

**Check if email is enabled:**
1. Go to **Authentication** → **Settings**
2. Look for **"Enable email confirmations"** - should be ON
3. Check **"Email rate limit"** - free tier is 3 emails/hour

#### Email Templates
1. Go to **Authentication** → **Email Templates**
2. Check **"Confirm signup"** template exists and is enabled
3. Verify the redirect URL in the template matches your app URL

### 2. Check Redirect URLs

1. Go to **Authentication** → **URL Configuration**
2. Verify these URLs are added:
   - `https://your-domain.com/auth/confirm`
   - `http://localhost:3000/auth/confirm` (for local dev)
   - Your Vercel deployment URL: `https://your-app.vercel.app/auth/confirm`

### 3. Try Resending Confirmation Email

**Option A: From Login Page**
1. Try to log in with the email that signed up
2. If you get an error about email confirmation, a **"Resend confirmation email"** button will appear
3. Click it to resend the email

**Option B: From Signup Page**
1. After signing up, if email wasn't confirmed, a **"Resend confirmation email"** button will appear on the signup form
2. Click it to resend

### 4. Check Email Spam Folder

- Check the spam/junk folder
- Some email providers (Gmail, Outlook) may filter Supabase emails
- Check if the email domain is blocked

### 5. Check Supabase Logs

1. Go to **Logs** → **Auth Logs** in Supabase Dashboard
2. Look for errors related to email sending
3. Check for rate limiting errors

### 6. Verify Environment Variables

Make sure these are set in Vercel:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_BASE_URL` (should be your production URL)

### 7. Test Email Sending

You can test if Supabase can send emails:
1. Go to **Authentication** → **Users** in Supabase Dashboard
2. Find the user who didn't receive email
3. Click on the user
4. Look for **"Resend confirmation email"** button
5. Click it to manually resend

### 8. Disable Email Confirmation (Development Only)

**⚠️ WARNING: Only for development/testing. Never disable in production!**

1. Go to **Authentication** → **Settings**
2. Find **"Enable email confirmations"**
3. Turn it OFF
4. Users can now log in without confirming email

**To re-enable:**
- Turn it back ON
- Existing unconfirmed users will need to confirm their email

### 9. Manual Email Confirmation (Admin)

If you need to manually confirm a user's email:

1. Go to **Authentication** → **Users** in Supabase Dashboard
2. Find the user
3. Click on the user
4. Look for **"Confirm email"** or **"Email confirmed"** toggle
5. Manually confirm the email

### 10. Check Rate Limits

**Free Tier Limits:**
- 3 emails per hour per project
- If you've sent 3 emails in the last hour, you need to wait

**Solution:**
- Wait for the rate limit to reset
- Upgrade to a paid plan for higher limits
- Configure custom SMTP for unlimited emails

## Common Error Messages

### "Failed to resend confirmation email"
- Check Supabase logs for specific error
- Verify email service is configured
- Check rate limits

### "Too many requests"
- You've hit the rate limit (3/hour on free tier)
- Wait a few minutes and try again

### "No account found with this email"
- User doesn't exist in Supabase Auth
- They need to sign up first

### "This email is already confirmed"
- Email is already confirmed
- User can log in directly

## Next Steps

1. **Try the resend button** on the login page after attempting to log in
2. **Check Supabase Dashboard** for email sending errors
3. **Verify redirect URLs** are configured correctly
4. **Check spam folder** for the confirmation email
5. **Review Supabase logs** for detailed error messages

If emails still aren't sending, the issue is likely:
- Email service not configured in Supabase
- Rate limit exceeded
- Email provider blocking Supabase emails
- Redirect URLs not configured correctly

