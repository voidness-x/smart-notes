# Step-by-Step Deployment Guide

Follow these steps to deploy your Smart Notes app to Vercel.

## Prerequisites Checklist

Before starting, make sure you have:
- [ ] A GitHub account
- [ ] A Supabase account and project
- [ ] An OpenAI API key
- [ ] Git installed on your computer (download from https://git-scm.com/download/win)

---

## Step 1: Install Git (if not installed)

1. Download Git from: https://git-scm.com/download/win
2. Run the installer (use default settings)
3. Restart your terminal/PowerShell after installation

---

## Step 2: Prepare Your Code

### 2.1 Initialize Git Repository (if not already done)

Open PowerShell in your project folder and run:

```powershell
cd C:\Windows\System32\smart-notes
git init
git add .
git commit -m "Initial commit - ready for deployment"
```

### 2.2 Create GitHub Repository

1. Go to https://github.com
2. Click the "+" icon → "New repository"
3. Name it: `smart-notes` (or any name you prefer)
4. **Don't** initialize with README (you already have one)
5. Click "Create repository"

### 2.3 Push Code to GitHub

GitHub will show you commands. Run these in PowerShell:

```powershell
git remote add origin https://github.com/YOUR_USERNAME/smart-notes.git
git branch -M main
git push -u origin main
```

(Replace `YOUR_USERNAME` with your GitHub username)

---

## Step 3: Get Your Environment Variables

### 3.1 Supabase Variables

1. Go to https://app.supabase.com
2. Select your project (or create one if you don't have one)
3. Go to **Settings** → **API**
4. Copy these values:
   - **Project URL** → You'll use this for:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `SUPABASE_URL`
   - **anon public** key → You'll use this for:
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `SUPABASE_ANON_KEY`
   - **service_role** key → For:
     - `SUPABASE_SERVICE_ROLE_KEY` (optional, for admin features)

5. Go to **Settings** → **Database**
6. Under "Connection string", copy the **URI** format
   - Use this for both `DATABASE_URL` and `DIRECT_URL`

### 3.2 OpenAI API Key

1. Go to https://platform.openai.com/api-keys
2. Click "Create new secret key"
3. Copy the key (you won't see it again!)
4. This is your `OPENAI_API_KEY`

### 3.3 Write Down Your Variables

Create a temporary file with your variables (don't commit this!):

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc... (optional)
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
DIRECT_URL=postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
OPENAI_API_KEY=sk-...
```

---

## Step 4: Deploy to Vercel

### 4.1 Sign Up for Vercel

1. Go to https://vercel.com
2. Click "Sign Up"
3. Choose "Continue with GitHub"
4. Authorize Vercel to access your GitHub

### 4.2 Import Your Project

1. After logging in, click **"Add New Project"**
2. You'll see your GitHub repositories
3. Find `smart-notes` and click **"Import"**

### 4.3 Configure Project Settings

Vercel will auto-detect Next.js, but verify:

- **Framework Preset**: Next.js (auto-detected)
- **Root Directory**: `./` (leave as is)
- **Build Command**: `pnpm build` (or `npm run build`)
- **Output Directory**: `.next` (auto-detected)
- **Install Command**: `pnpm install` (or `npm install`)

### 4.4 Add Environment Variables

**IMPORTANT:** Add ALL these variables before deploying!

1. Scroll down to **"Environment Variables"**
2. Click **"Add"** for each variable:

   Add these one by one:

   | Variable Name | Value | Environment |
   |--------------|-------|-------------|
   | `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase URL | Production, Preview, Development |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key | Production, Preview, Development |
   | `SUPABASE_URL` | Same as above | Production, Preview, Development |
   | `SUPABASE_ANON_KEY` | Same as above | Production, Preview, Development |
   | `SUPABASE_SERVICE_ROLE_KEY` | Your service role key | Production, Preview, Development |
   | `DATABASE_URL` | Your PostgreSQL connection string | Production, Preview, Development |
   | `DIRECT_URL` | Same as DATABASE_URL | Production, Preview, Development |
   | `OPENAI_API_KEY` | Your OpenAI key | Production, Preview, Development |

   **Tip:** Make sure to select all three environments (Production, Preview, Development) for each variable!

3. After adding all variables, click **"Deploy"**

### 4.5 Wait for Deployment

- Vercel will build your app (takes 2-5 minutes)
- You'll see build logs in real-time
- If build succeeds, you'll get a URL like: `smart-notes.vercel.app`

---

## Step 5: Run Database Migrations

After your first deployment, you need to set up your database:

### Option A: Using Vercel CLI (Recommended)

1. Install Vercel CLI:
   ```powershell
   npm install -g vercel
   ```

2. Login to Vercel:
   ```powershell
   vercel login
   ```

3. Link your project:
   ```powershell
   cd C:\Windows\System32\smart-notes
   vercel link
   ```
   - Select your project when prompted

4. Pull environment variables:
   ```powershell
   vercel env pull .env.local
   ```

5. Run migrations:
   ```powershell
   pnpm dlx prisma migrate deploy
   ```

### Option B: Using Supabase SQL Editor

1. Go to your Supabase project
2. Click **SQL Editor**
3. Open your migration files from `src/db/migrations/`
4. Copy and paste the SQL into the editor
5. Run each migration file in order

### Option C: Manual Migration (if database allows external connections)

1. Make sure your `.env.local` has `DATABASE_URL` set
2. Run:
   ```powershell
   pnpm dlx prisma migrate deploy
   ```

---

## Step 6: Test Your Deployment

1. Visit your Vercel URL (e.g., `smart-notes.vercel.app`)
2. Test these features:
   - [ ] Sign up for a new account
   - [ ] Check your email for confirmation link
   - [ ] Log in
   - [ ] Create a note
   - [ ] Test AI features
   - [ ] Test collaboration features

---

## Step 7: Configure Custom Domain (Optional)

1. In Vercel dashboard, go to your project
2. Click **Settings** → **Domains**
3. Add your custom domain
4. Follow Vercel's instructions to configure DNS

---

## 🚨 Troubleshooting

### Build Fails

**Error: "Prisma Client not found"**
- ✅ Already fixed! We added `postinstall` script to generate Prisma client

**Error: "Cannot find module"**
- Make sure all dependencies are in `package.json`
- Try running `pnpm install` locally first

**Error: "Environment variable not found"**
- Double-check all variables are added in Vercel
- Make sure variables are set for all environments
- Restart deployment after adding variables

### Database Connection Errors

**Error: "Can't reach database server"**
- Check `DATABASE_URL` format is correct
- Ensure database allows connections from Vercel
- For Supabase: Make sure you're using the connection pooler URL if available

**Error: "Migration failed"**
- Run migrations manually (see Step 5)
- Check database permissions
- Verify `DIRECT_URL` is set correctly

### Runtime Errors

**Error: "Supabase authentication failed"**
- Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Check Supabase project is active
- Verify redirect URLs in Supabase dashboard:
  - Go to Authentication → URL Configuration
  - Add your Vercel URL to "Redirect URLs"

**Error: "OpenAI API error"**
- Check `OPENAI_API_KEY` is correct
- Verify you have credits in your OpenAI account
- Check API rate limits

---

## ✅ Success Checklist

- [ ] Code pushed to GitHub
- [ ] Vercel project created
- [ ] All environment variables added
- [ ] Build completed successfully
- [ ] Database migrations run
- [ ] App is accessible at Vercel URL
- [ ] Authentication works
- [ ] Database operations work
- [ ] AI features work

---

## 🎉 You're Done!

Your Smart Notes app is now live! Share your Vercel URL with others.

**Next Steps:**
- Set up custom domain (optional)
- Configure Supabase redirect URLs
- Monitor your app in Vercel dashboard
- Set up error tracking (optional)

---

## Need Help?

- Check [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed information
- Check [QUICK_DEPLOY.md](./QUICK_DEPLOY.md) for quick reference
- Vercel Docs: https://vercel.com/docs
- Supabase Docs: https://supabase.com/docs

