# Fix Runtime Errors - Deployment Checklist

Your app is deployed but showing 500 errors. Follow these steps:

## ✅ Step 1: Verify Environment Variables in Vercel

Go to your Vercel project → **Settings** → **Environment Variables**

**Required variables (check ALL are set):**

1. **Supabase Variables:**
   - `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon/public key
   - `SUPABASE_URL` - Same as NEXT_PUBLIC_SUPABASE_URL
   - `SUPABASE_ANON_KEY` - Same as NEXT_PUBLIC_SUPABASE_ANON_KEY
   - `SUPABASE_SERVICE_ROLE_KEY` - (Optional) Service role key

2. **Database Variables:**
   - `DATABASE_URL` - PostgreSQL connection string from Supabase
   - `DIRECT_URL` - Same as DATABASE_URL (or direct connection)

3. **OpenAI:**
   - `OPENAI_API_KEY` - Your OpenAI API key

**Important:**
- Make sure variables are set for **Production**, **Preview**, AND **Development**
- After adding/updating variables, **redeploy** your app

## ✅ Step 2: Run Database Migrations

Your database needs to have the tables created. Run migrations:

### Option A: Using Supabase SQL Editor (Easiest)

1. Go to your Supabase project: https://app.supabase.com
2. Click **SQL Editor** in the left sidebar
3. Open each migration file from `src/db/migrations/` in order:
   - Run them one by one, starting with the oldest timestamp
4. Or run all migrations at once by copying all SQL from migration files

### Option B: Using Vercel CLI

```powershell
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Link your project
cd C:\Users\EllaT\Projects\smart-notes
vercel link

# Pull environment variables
vercel env pull .env.local

# Run migrations
pnpm dlx prisma migrate deploy
```

## ✅ Step 3: Verify Supabase Configuration

1. Go to Supabase Dashboard → **Settings** → **API**
2. Copy the exact values:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_URL`
   - anon public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY` and `SUPABASE_ANON_KEY`

3. Go to **Settings** → **Database**
4. Copy the connection string:
   - Use **Connection string** → **URI** format
   - Use for both `DATABASE_URL` and `DIRECT_URL`

## ✅ Step 4: Check Supabase Redirect URLs

1. Go to Supabase Dashboard → **Authentication** → **URL Configuration**
2. Add your Vercel URL to **Redirect URLs**:
   - `https://your-project.vercel.app`
   - `https://your-project.vercel.app/auth/confirm`
   - `https://your-project.vercel.app/login`
   - `https://your-project.vercel.app/sign-up`

## ✅ Step 5: Redeploy After Changes

After updating environment variables:
1. Go to Vercel Dashboard
2. Click on your deployment
3. Click **Redeploy** (or it will auto-redeploy)

## 🔍 Step 6: Check Vercel Logs

1. Go to Vercel Dashboard → Your Project → **Logs**
2. Look for errors related to:
   - Missing environment variables
   - Database connection failures
   - Prisma errors

## 🐛 Common Issues

### Issue: "Missing Supabase environment variables"
**Fix:** Add all Supabase variables in Vercel settings

### Issue: "Database connection failed"
**Fix:** 
- Check `DATABASE_URL` is correct
- Ensure database allows connections from Vercel
- For Supabase: Use connection pooler URL

### Issue: "Table does not exist"
**Fix:** Run database migrations (Step 2)

## 📝 Quick Checklist

- [ ] All environment variables added in Vercel
- [ ] Variables set for Production, Preview, and Development
- [ ] Database migrations run
- [ ] Supabase redirect URLs configured
- [ ] App redeployed after changes
- [ ] Checked Vercel logs for specific errors

