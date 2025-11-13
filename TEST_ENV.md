# Test Environment Variables

## Quick Test Script

After fixing the Site URL, test if everything works:

1. **Go to your app:** `https://smart-notes.vercel.app/login`
2. **Open browser console (F12 → Console)**
3. **Try to log in**
4. **Check console for errors**

## Common Error Messages:

### "Missing Supabase environment variables"
**Fix:** Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to Vercel

### "Database connection failed"
**Fix:** Check DATABASE_URL is correct in Vercel

### "Table does not exist"
**Fix:** Run migrations again in Supabase

### "Invalid redirect URL"
**Fix:** Check Supabase Site URL is set to Vercel URL (not localhost)

## Test Checklist:

- [ ] Site URL is Vercel URL (not localhost)
- [ ] All environment variables set in Vercel
- [ ] App redeployed after changes
- [ ] Tested login
- [ ] No errors in console
- [ ] No errors in Vercel logs

