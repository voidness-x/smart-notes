# Fix It Now - Step by Step

Let's fix this step by step. I'll guide you through everything.

## 🔍 STEP 1: Check Supabase Site URL (IMPORTANT!)

I noticed in your Supabase dashboard, the **Site URL** is set to `http://localhost:3000`. This needs to be your Vercel URL!

### Fix Site URL:

1. **Go to Supabase Dashboard:**
   - https://app.supabase.com
   - Select your project
   - Go to **Authentication** → **URL Configuration**

2. **Change Site URL:**
   - Change from: `http://localhost:3000`
   - Change to: `https://smart-notes.vercel.app` (or your actual Vercel URL)
   - Click **Save changes**

3. **Verify Redirect URLs:**
   - Make sure these are in the list:
     - `https://smart-notes.vercel.app`
     - `https://smart-notes.vercel.app/auth/confirm`
     - `https://smart-notes.vercel.app/login`
     - `https://smart-notes.vercel.app/sign-up`
     - `https://smart-notes.vercel.app/notes`
   - All should be checked/enabled

## 🔍 STEP 2: Check Environment Variables in Vercel

### Go to Vercel → Your Project → Settings → Environment Variables

**Make sure these are set for Production:**

1. **`NEXT_PUBLIC_SUPABASE_URL`**
   - Value: Your Supabase project URL (from Supabase → Settings → API)
   - Example: `https://xxxxx.supabase.co`

2. **`NEXT_PUBLIC_SUPABASE_ANON_KEY`**
   - Value: Your Supabase anon key (from Supabase → Settings → API)
   - Example: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

3. **`SUPABASE_URL`**
   - Value: Same as NEXT_PUBLIC_SUPABASE_URL
   - Example: `https://xxxxx.supabase.co`

4. **`SUPABASE_ANON_KEY`**
   - Value: Same as NEXT_PUBLIC_SUPABASE_ANON_KEY
   - Example: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

5. **`DATABASE_URL`**
   - Value: PostgreSQL connection string (from Supabase → Settings → Database)
   - Example: `postgresql://postgres:[PASSWORD]@db.xxxxx.supabase.co:5432/postgres?sslmode=require`
   - **Important:** Replace `[PASSWORD]` with your database password

6. **`DIRECT_URL`**
   - Value: Same as DATABASE_URL (or direct connection string)
   - Example: Same as DATABASE_URL

7. **`OPENAI_API_KEY`**
   - Value: Your OpenAI API key
   - Example: `sk-...`

**After adding/updating variables:**
- Click **Save**
- Go to **Deployments** tab
- Click **Redeploy** on the latest deployment

## 🔍 STEP 3: Test Database Connection

### Test if database is working:

1. **Go to Supabase → SQL Editor**
2. **Run this query:**
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public' 
   ORDER BY table_name;
   ```
3. **You should see:**
   - User
   - Note
   - Review
   - ReviewReply
   - CollaborationInvite
   - SupportTicket
   - _NoteCollaborators

4. **If tables are missing:**
   - Run the `COMPLETE_MIGRATION.sql` script again
   - Check for any errors

## 🔍 STEP 4: Test Login Again

### After fixing Site URL and environment variables:

1. **Go to your app:** `https://smart-notes.vercel.app/login`
2. **Try to log in**
3. **Check what happens:**
   - Does it redirect to notes page? ✅ Success!
   - Does it show an error? ❌ Need to check error message
   - Does nothing happen? ❌ Need to check console/logs

## 🔍 STEP 5: Check for Errors

### A. Browser Console:
1. Open DevTools (F12)
2. Go to **Console** tab
3. Try to log in
4. **Look for red error messages**
5. **Copy any errors**

### B. Vercel Logs:
1. Go to Vercel Dashboard → Your Project → **Logs**
2. Try to log in
3. **Look for errors** (red text)
4. **Copy any error messages**

### C. Network Tab:
1. Open DevTools (F12)
2. Go to **Network** tab
3. Try to log in
4. **Look for failed requests** (red)
5. **Click on failed requests** to see error details

## 🐛 Common Issues & Quick Fixes

### Issue: "500 Internal Server Error"

**Most likely causes:**
1. Missing environment variables
2. Wrong DATABASE_URL
3. Database connection failed
4. Prisma Client error

**Fix:**
1. Check Vercel logs for specific error
2. Verify all environment variables are set
3. Check DATABASE_URL is correct
4. Redeploy after fixing

### Issue: "Invalid email or password"

**Most likely causes:**
1. Email not confirmed
2. Wrong credentials
3. Supabase authentication issue

**Fix:**
1. Check email for confirmation link
2. Try signing up again
3. Check Supabase → Authentication → Users

### Issue: "Database connection failed"

**Most likely causes:**
1. Wrong DATABASE_URL
2. Database password incorrect
3. Database not accessible

**Fix:**
1. Get correct DATABASE_URL from Supabase
2. Make sure password is correct
3. Use connection pooler URL if available

### Issue: "Table does not exist"

**Most likely causes:**
1. Migrations didn't run
2. Wrong database
3. Tables in different schema

**Fix:**
1. Run migration script again
2. Verify you're using correct database
3. Check Supabase Table Editor

## 🎯 Quick Checklist

- [ ] Site URL changed to Vercel URL (not localhost)
- [ ] All environment variables set in Vercel
- [ ] Environment variables set for Production, Preview, and Development
- [ ] All tables exist in Supabase
- [ ] Redirect URLs configured in Supabase
- [ ] App redeployed after changes
- [ ] Tested login
- [ ] Checked for errors

## 🆘 Still Not Working?

**Share these with me:**

1. **What error do you see when logging in?**
   - Copy the exact error message

2. **What errors are in browser console?**
   - Copy any red error messages

3. **What errors are in Vercel logs?**
   - Copy any error messages

4. **Are environment variables set?**
   - Yes/No

5. **Do tables exist in Supabase?**
   - Yes/No

6. **What's your Vercel URL?**
   - Share the URL

Once I know these, I can help you fix it! 🚀

