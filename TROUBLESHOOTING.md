# Troubleshooting Guide - Step by Step

Let's fix this systematically. Follow these steps in order.

## 🔍 Step 1: Check What Error You're Getting

### A. Test Login
1. Go to your Vercel URL: `https://smart-notes.vercel.app/login`
2. Try to log in
3. **What happens?**
   - Does it show an error message?
   - Does it redirect somewhere?
   - Does nothing happen?
   - **Write down the exact error message**

### B. Check Browser Console
1. Open DevTools (F12)
2. Go to **Console** tab
3. Try to log in again
4. **What errors do you see?**
   - Copy any red error messages
   - Look for 500 errors
   - Look for network errors

### C. Check Vercel Logs
1. Go to Vercel Dashboard
2. Click on your project
3. Go to **Logs** tab
4. Try to log in again
5. **What errors do you see in the logs?**
   - Copy any error messages
   - Look for database errors
   - Look for authentication errors

## ✅ Step 2: Verify Environment Variables

Go to Vercel → Your Project → **Settings** → **Environment Variables**

**Check these variables are set (for Production):**

1. `NEXT_PUBLIC_SUPABASE_URL` = Your Supabase project URL
2. `NEXT_PUBLIC_SUPABASE_ANON_KEY` = Your Supabase anon key
3. `SUPABASE_URL` = Same as NEXT_PUBLIC_SUPABASE_URL
4. `SUPABASE_ANON_KEY` = Same as NEXT_PUBLIC_SUPABASE_ANON_KEY
5. `DATABASE_URL` = Your PostgreSQL connection string
6. `DIRECT_URL` = Same as DATABASE_URL (or direct connection)
7. `OPENAI_API_KEY` = Your OpenAI API key

**Important:**
- Make sure each variable is set for **Production**, **Preview**, AND **Development**
- After adding/updating variables, **redeploy** your app

## ✅ Step 3: Verify Database Connection

### Test Database Connection in Supabase

1. Go to Supabase Dashboard
2. Click **SQL Editor**
3. Run this query:
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public' 
   ORDER BY table_name;
   ```
4. **Do you see these tables?**
   - User
   - Note
   - Review
   - ReviewReply
   - CollaborationInvite
   - SupportTicket
   - _NoteCollaborators

If tables are missing, run the migration script again.

## ✅ Step 4: Verify Supabase Authentication

1. Go to Supabase Dashboard
2. Click **Authentication** → **Users**
3. **Do you see any users?**
   - If not, try creating a test user
   - Or try signing up from your app

4. Check **Authentication** → **URL Configuration**
   - **Site URL** should be: `https://smart-notes.vercel.app` (or your Vercel URL)
   - **Redirect URLs** should include:
     - `https://smart-notes.vercel.app`
     - `https://smart-notes.vercel.app/auth/confirm`
     - `https://smart-notes.vercel.app/login`
     - `https://smart-notes.vercel.app/sign-up`
     - `https://smart-notes.vercel.app/notes`

## ✅ Step 5: Test Database Queries

1. Go to Supabase SQL Editor
2. Run this query to test if database works:
   ```sql
   SELECT * FROM "User" LIMIT 1;
   ```
3. **Does it work?**
   - If yes: Database is connected
   - If no: There's a database issue

## 🐛 Common Issues & Quick Fixes

### Issue 1: "500 Internal Server Error" on Login

**Possible Causes:**
1. Missing environment variables
2. Database connection failed
3. Prisma Client not generated
4. Database tables don't exist

**Fix:**
1. Check Vercel logs for specific error
2. Verify all environment variables are set
3. Check if database migrations ran
4. Redeploy after fixing

### Issue 2: "Authentication failed"

**Possible Causes:**
1. Supabase redirect URLs not configured
2. Wrong Supabase URL or key
3. Email not confirmed

**Fix:**
1. Check Supabase redirect URLs
2. Verify Supabase environment variables
3. Check email for confirmation link

### Issue 3: "Database connection failed"

**Possible Causes:**
1. Wrong DATABASE_URL
2. Database not accessible
3. Connection pooler issue

**Fix:**
1. Verify DATABASE_URL in Vercel
2. Check Supabase database connection string
3. Make sure database allows connections from Vercel

### Issue 4: "Table does not exist"

**Possible Causes:**
1. Migrations didn't run
2. Wrong database
3. Tables in different schema

**Fix:**
1. Run migration script again
2. Check which database you're connecting to
3. Verify tables exist in Supabase

## 📝 Quick Diagnostic Checklist

Answer these questions:

1. **What error do you see when logging in?**
   - [ ] 500 Internal Server Error
   - [ ] 401 Unauthorized
   - [ ] "Invalid email or password"
   - [ ] Nothing happens
   - [ ] Other: _______________

2. **What errors are in the browser console?**
   - [ ] No errors
   - [ ] Network errors
   - [ ] Authentication errors
   - [ ] Database errors
   - [ ] Other: _______________

3. **What errors are in Vercel logs?**
   - [ ] No errors
   - [ ] Database connection failed
   - [ ] Missing environment variable
   - [ ] Prisma error
   - [ ] Other: _______________

4. **Are all tables created in Supabase?**
   - [ ] Yes, all tables exist
   - [ ] No, some tables are missing
   - [ ] Not sure

5. **Are environment variables set in Vercel?**
   - [ ] Yes, all variables are set
   - [ ] No, some are missing
   - [ ] Not sure

## 🆘 Need Help?

Share the following information:
1. The exact error message you see
2. What happens when you try to log in
3. Any errors from browser console
4. Any errors from Vercel logs
5. Screenshot of the error (if possible)

## 🎯 Next Steps

1. **Test login and note the exact error**
2. **Check Vercel logs for specific errors**
3. **Verify environment variables are set**
4. **Verify database tables exist**
5. **Share the error messages with me**

Let's fix this step by step! 🚀

