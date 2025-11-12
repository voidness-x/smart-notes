# 🚀 Start Deployment Here!

This is your **quick start guide** to deploy Smart Notes. Follow these steps in order.

## ⚡ Quick Start (5 Steps)

### Step 1: Install Git (if needed)
- Download: https://git-scm.com/download/win
- Install with default settings
- Restart your terminal after installation

### Step 2: Push Code to GitHub

Open PowerShell in your project folder:

```powershell
cd C:\Windows\System32\smart-notes

# Initialize git (if not done)
git init
git add .
git commit -m "Ready for deployment"

# Create repo on GitHub first, then:
git remote add origin https://github.com/YOUR_USERNAME/smart-notes.git
git branch -M main
git push -u origin main
```

### Step 3: Get Environment Variables

**From Supabase:**
1. Go to https://app.supabase.com → Your Project → Settings → API
2. Copy: Project URL and anon key
3. Go to Settings → Database → Copy connection string

**From OpenAI:**
1. Go to https://platform.openai.com/api-keys
2. Create and copy your API key

### Step 4: Deploy to Vercel

1. Go to https://vercel.com → Sign up with GitHub
2. Click "Add New Project" → Import your repo
3. **Add ALL environment variables** (see list below)
4. Click "Deploy"

**Required Environment Variables:**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (optional)
- `DATABASE_URL`
- `DIRECT_URL`
- `OPENAI_API_KEY`

### Step 5: Run Database Migrations

After deployment, run:
```powershell
pnpm dlx prisma migrate deploy
```

Or use Supabase SQL Editor to run migration files manually.

---

## 📚 Detailed Guides

- **Full Step-by-Step**: See [DEPLOY_STEPS.md](./DEPLOY_STEPS.md)
- **Quick Reference**: See [QUICK_DEPLOY.md](./QUICK_DEPLOY.md)
- **All Options**: See [DEPLOYMENT.md](./DEPLOYMENT.md)

---

## ✅ Ready to Deploy?

Your project is configured and ready! Just follow the steps above.

**Need help?** Check the detailed guides or the troubleshooting section in DEPLOY_STEPS.md

