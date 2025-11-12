# Quick Deployment Checklist

## 🎯 Recommended: Deploy to Vercel (5 minutes)

### Step 1: Prepare Your Code
```bash
# Make sure your code is committed
git add .
git commit -m "Ready for deployment"
git push origin main
```

### Step 2: Get Your Environment Variables

**From Supabase:**
1. Go to https://app.supabase.com
2. Select your project → Settings → API
3. Copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_URL`
   - anon/public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY` and `SUPABASE_ANON_KEY`
   - service_role key → `SUPABASE_SERVICE_ROLE_KEY` (optional)

4. Go to Settings → Database
5. Copy Connection string → `DATABASE_URL` and `DIRECT_URL`

**From OpenAI:**
1. Go to https://platform.openai.com/api-keys
2. Create new API key → `OPENAI_API_KEY`

### Step 3: Deploy to Vercel

1. **Sign up/Login**
   - Go to https://vercel.com
   - Sign up with GitHub

2. **Import Project**
   - Click "Add New Project"
   - Import your GitHub repository
   - Vercel auto-detects Next.js ✅

3. **Add Environment Variables**
   - In project settings, add these variables:
     ```
     NEXT_PUBLIC_SUPABASE_URL=...
     NEXT_PUBLIC_SUPABASE_ANON_KEY=...
     SUPABASE_URL=...
     SUPABASE_ANON_KEY=...
     SUPABASE_SERVICE_ROLE_KEY=... (optional)
     DATABASE_URL=...
     DIRECT_URL=...
     OPENAI_API_KEY=...
     ```
   - Make sure to add for: Production, Preview, and Development

4. **Deploy**
   - Click "Deploy"
   - Wait for build to complete (~2-3 minutes)
   - Your app is live! 🎉

### Step 4: Run Database Migrations

After first deployment, run migrations:

**Option A: Using Vercel CLI**
```bash
npm i -g vercel
vercel login
vercel link
vercel env pull .env.local
pnpm dlx prisma migrate deploy
```

**Option B: Using Supabase Dashboard**
- Go to Supabase SQL Editor
- Run your migration SQL files manually

**Option C: Local migration (if database allows external connections)**
```bash
# Set DATABASE_URL in your local .env.local
pnpm dlx prisma migrate deploy
```

### Step 5: Verify Deployment

✅ Check your live URL (e.g., `your-project.vercel.app`)
✅ Test authentication (sign up/login)
✅ Test creating a note
✅ Test AI features

---

## 🚨 Common Issues & Fixes

**Build fails: "Prisma Client not found"**
- ✅ Fixed! We added `postinstall` script to generate Prisma client automatically

**Database connection errors**
- Check `DATABASE_URL` format: `postgresql://user:pass@host:port/db?sslmode=require`
- Ensure database allows connections from Vercel IPs
- For Supabase: Use connection pooler URL if available

**Environment variables not working**
- Make sure variables are added for all environments (Production/Preview/Development)
- Restart deployment after adding variables
- Check variable names match exactly (case-sensitive)

**Migrations not running**
- Run `pnpm dlx prisma migrate deploy` manually
- Or add to build command: `"build": "prisma migrate deploy && prisma generate && next build"`

---

## 📝 Environment Variables Reference

| Variable | Required | Where to Get |
|----------|----------|--------------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase Settings → API |
| `SUPABASE_URL` | ✅ | Same as above |
| `SUPABASE_ANON_KEY` | ✅ | Same as above |
| `SUPABASE_SERVICE_ROLE_KEY` | ⚠️ | Supabase Settings → API (for admin) |
| `DATABASE_URL` | ✅ | Supabase Settings → Database |
| `DIRECT_URL` | ✅ | Same as DATABASE_URL |
| `OPENAI_API_KEY` | ✅ | OpenAI Platform → API Keys |

---

## 🎉 You're Done!

Your Smart Notes app should now be live and accessible to the world!

For more detailed information, see [DEPLOYMENT.md](./DEPLOYMENT.md)

