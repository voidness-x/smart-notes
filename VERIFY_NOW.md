# Verify Everything is Set Correctly

## ✅ Step 1: Check Vercel Environment Variables (CRITICAL!)

**Go to:** Vercel Dashboard → Your Project → **Settings** → **Environment Variables**

### Check These Variables Exist (Production):

1. **`NEXT_PUBLIC_SUPABASE_URL`**
   - Value: `https://xxxxx.supabase.co` (from Supabase → Settings → API)
   - ✅ Set for: Production, Preview, Development

2. **`NEXT_PUBLIC_SUPABASE_ANON_KEY`**
   - Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (from Supabase → Settings → API)
   - ✅ Set for: Production, Preview, Development

3. **`SUPABASE_URL`**
   - Value: Same as NEXT_PUBLIC_SUPABASE_URL
   - ✅ Set for: Production, Preview, Development

4. **`SUPABASE_ANON_KEY`**
   - Value: Same as NEXT_PUBLIC_SUPABASE_ANON_KEY
   - ✅ Set for: Production, Preview, Development

5. **`DATABASE_URL`**
   - Value: `postgresql://postgres:[PASSWORD]@db.xxxxx.supabase.co:5432/postgres?sslmode=require`
   - **Important:** Replace `[PASSWORD]` with your database password
   - ✅ Set for: Production, Preview, Development

6. **`DIRECT_URL`**
   - Value: Same as DATABASE_URL
   - ✅ Set for: Production, Preview, Development

7. **`OPENAI_API_KEY`**
   - Value: `sk-...` (from OpenAI)
   - ✅ Set for: Production, Preview, Development

### How to Get Database Password:

1. Go to Supabase → Settings → Database
2. Scroll to **Database password** section
3. If you don't know it, click **Reset database password**
4. Copy the password
5. Use it in DATABASE_URL (replace `[PASSWORD]`)

### How to Get Connection String:

1. Go to Supabase → Settings → Database
2. Scroll to **Connection string** section
3. Click **URI** tab
4. Copy the connection string
5. Replace `[YOUR-PASSWORD]` with your actual password
6. Use it for DATABASE_URL and DIRECT_URL

## ✅ Step 2: Fix Supabase Site URL (CRITICAL!)

**Go to:** Supabase Dashboard → Authentication → URL Configuration

1. **Change Site URL:**
   - From: `http://localhost:3000` ❌
   - To: `https://smart-notes.vercel.app` ✅
   - Click **Save changes**

2. **Verify Redirect URLs:**
   - Make sure these are listed and enabled:
     - ✅ `https://smart-notes.vercel.app`
     - ✅ `https://smart-notes.vercel.app/auth/confirm`
     - ✅ `https://smart-notes.vercel.app/login`
     - ✅ `https://smart-notes.vercel.app/sign-up`
     - ✅ `https://smart-notes.vercel.app/notes`

## ✅ Step 3: Redeploy After Changes

**After fixing environment variables and Site URL:**

1. Go to Vercel Dashboard → Your Project → **Deployments**
2. Click **Redeploy** on latest deployment
3. Wait for deployment to complete (2-3 minutes)

## ✅ Step 4: Test Login Again

**After redeploying:**

1. Go to: `https://smart-notes.vercel.app/login`
2. Try to log in
3. Check what happens:
   - ✅ Redirects to notes? → Success!
   - ❌ Still shows error? → Check Vercel logs

## 🔍 Step 5: Check Vercel Logs for Specific Error

**If login still fails:**

1. Go to Vercel Dashboard → Your Project → **Logs**
2. Try to log in again
3. Look for error messages (red text)
4. **Copy the error message** and share it with me

## 🎯 Most Common Issues:

### Issue: "Missing Supabase environment variables"
**Fix:** Add SUPABASE_URL and SUPABASE_ANON_KEY to Vercel

### Issue: "Database connection failed"
**Fix:** Check DATABASE_URL is correct and password is set

### Issue: "Invalid redirect URL"
**Fix:** Change Supabase Site URL to Vercel URL (not localhost)

### Issue: "Table does not exist"
**Fix:** Run migrations again in Supabase SQL Editor

## 📝 Quick Checklist:

- [ ] All 7 environment variables set in Vercel
- [ ] Variables set for Production, Preview, Development
- [ ] DATABASE_URL has correct password (not [PASSWORD])
- [ ] Supabase Site URL changed to Vercel URL
- [ ] Redirect URLs configured in Supabase
- [ ] App redeployed after changes
- [ ] Tested login
- [ ] Checked Vercel logs for errors

## 🆘 Still Not Working?

**Share with me:**

1. **What error do you see in Vercel logs?** (Most important!)
2. **What error do you see in browser console?**
3. **Are all environment variables set?**
4. **Did you change the Site URL?**
5. **Did you redeploy after changes?**

Let's fix this together! 🚀

