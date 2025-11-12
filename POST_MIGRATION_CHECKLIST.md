# Post-Migration Checklist

You've run the database migrations! Now follow these steps:

## ✅ Step 1: Verify Tables Were Created

1. **Go to Supabase Dashboard:**
   - Open https://app.supabase.com
   - Select your project
   - Click **Table Editor** in the left sidebar

2. **Check if these tables exist:**
   - ✅ `User`
   - ✅ `Note`
   - ✅ `Review`
   - ✅ `ReviewReply`
   - ✅ `CollaborationInvite`
   - ✅ `SupportTicket`
   - ✅ `_NoteCollaborators`

3. **Verify table structure:**
   - Click on each table to see its columns
   - Make sure all columns are present

## ✅ Step 2: Configure Supabase Redirect URLs

1. **Go to Supabase Dashboard:**
   - Click **Authentication** → **URL Configuration**

2. **Add Redirect URLs:**
   Add your Vercel URL (replace with your actual URL):
   ```
   https://your-project.vercel.app
   https://your-project.vercel.app/auth/confirm
   https://your-project.vercel.app/login
   https://your-project.vercel.app/sign-up
   https://your-project.vercel.app/notes
   ```

3. **Save changes:**
   - Click **Save** after adding URLs

## ✅ Step 3: Test Your App

1. **Go to your Vercel URL:**
   - Visit: `https://your-project.vercel.app`

2. **Test Login:**
   - Try logging in with your credentials
   - Check if login works (should not show 500 error)

3. **Test Sign Up:**
   - Try creating a new account
   - Check if sign up works

4. **Test Features:**
   - Create a note
   - Check if notes page loads
   - Test other features

## ✅ Step 4: Check for Errors

1. **Check Browser Console:**
   - Open browser DevTools (F12)
   - Go to **Console** tab
   - Look for any errors

2. **Check Vercel Logs:**
   - Go to Vercel Dashboard → Your Project → **Logs**
   - Look for runtime errors
   - Check for database connection errors

## 🐛 Common Issues & Fixes

### Issue: "Table does not exist"
**Fix:** Make sure all migrations ran successfully. Check Supabase Table Editor.

### Issue: "Authentication failed"
**Fix:** 
- Check Supabase redirect URLs are configured
- Verify environment variables in Vercel
- Check Supabase project is active

### Issue: "Database connection failed"
**Fix:**
- Verify `DATABASE_URL` and `DIRECT_URL` in Vercel
- Check database is accessible from Vercel
- For Supabase: Use connection pooler URL

### Issue: "User not found in database"
**Fix:**
- This is normal for new signups
- The app should automatically create users in the database
- Check if user creation is working

## ✅ Step 5: Verify Environment Variables

Make sure all these are set in Vercel:

- ✅ `NEXT_PUBLIC_SUPABASE_URL`
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- ✅ `SUPABASE_URL`
- ✅ `SUPABASE_ANON_KEY`
- ✅ `SUPABASE_SERVICE_ROLE_KEY` (optional)
- ✅ `DATABASE_URL`
- ✅ `DIRECT_URL`
- ✅ `OPENAI_API_KEY`

## 🎉 Success Checklist

- [ ] All tables created in Supabase
- [ ] Supabase redirect URLs configured
- [ ] App loads without errors
- [ ] Login works
- [ ] Sign up works
- [ ] Notes page loads
- [ ] Can create notes
- [ ] No 500 errors in console

## 🆘 Still Having Issues?

If you're still seeing errors:

1. **Check Vercel Logs:**
   - Go to Vercel Dashboard → Your Project → **Logs**
   - Look for specific error messages
   - Share the error message for help

2. **Check Supabase Logs:**
   - Go to Supabase Dashboard → **Logs**
   - Check for database errors
   - Check for authentication errors

3. **Verify Environment Variables:**
   - Double-check all variables are set correctly
   - Make sure variables are set for Production, Preview, and Development

## 📝 Next Steps

Once everything works:
1. Test all features
2. Create your first note
3. Test collaboration features
4. Test AI features
5. Test support tickets
6. Test reviews

🎉 **Congratulations! Your app should now be fully functional!**

