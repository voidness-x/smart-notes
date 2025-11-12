# Deployment Guide for Smart Notes

This guide covers free deployment options for your Next.js application with PostgreSQL database.

## 📋 Prerequisites

Before deploying, ensure you have:
- A GitHub account (for Git-based deployments)
- Supabase account (for authentication and database)
- OpenAI API key (for AI features)
- All environment variables ready

## 🔑 Required Environment Variables

Your application requires the following environment variables:

### Supabase (Authentication & Database)
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous/public key
- `SUPABASE_URL` - Server-side Supabase URL (same as above)
- `SUPABASE_ANON_KEY` - Server-side Supabase anonymous key (same as above)
- `SUPABASE_SERVICE_ROLE_KEY` - (Optional) For admin functions like user deletion

### Database
- `DATABASE_URL` - PostgreSQL connection string (from Supabase)
- `DIRECT_URL` - Direct PostgreSQL connection string for migrations (from Supabase)

### OpenAI
- `OPENAI_API_KEY` - Your OpenAI API key

## 🚀 Deployment Options

### Option 1: Vercel (Recommended for Next.js)

**Why Vercel?**
- Created by the Next.js team, optimized for Next.js
- Free tier includes unlimited deployments
- Automatic deployments from Git
- Built-in CI/CD
- Free SSL certificates
- Global CDN
- Serverless functions support

**Free Tier Limits:**
- Unlimited deployments
- 100GB bandwidth/month
- Serverless function execution time: 10 seconds (Hobby plan)
- Perfect for personal projects and small applications

**Steps to Deploy:**

1. **Push your code to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```

2. **Sign up for Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Sign up with your GitHub account

3. **Import your project**
   - Click "Add New Project"
   - Import your GitHub repository
   - Vercel will auto-detect Next.js

4. **Configure Environment Variables**
   - In project settings, go to "Environment Variables"
   - Add all required variables listed above
   - Make sure to add them for all environments (Production, Preview, Development)

5. **Configure Build Settings**
   - Build Command: `pnpm build` (or `npm run build`)
   - Output Directory: `.next` (auto-detected)
   - Install Command: `pnpm install` (or `npm install`)

6. **Set up Prisma**
   - Add a build script in `package.json`:
     ```json
     "build": "prisma generate && next build"
     ```
   - Or add a postinstall script:
     ```json
     "postinstall": "prisma generate"
     ```

7. **Database Migrations**
   - Run migrations before first deployment:
     ```bash
     pnpm dlx prisma migrate deploy
     ```
   - Or set up a Vercel build command that runs migrations

8. **Deploy**
   - Click "Deploy"
   - Vercel will build and deploy your app
   - Your app will be live at `your-project.vercel.app`

**Vercel Configuration File (optional):**

Create `vercel.json` in the root:
```json
{
  "buildCommand": "pnpm build",
  "installCommand": "pnpm install",
  "framework": "nextjs",
  "regions": ["iad1"]
}
```

---

### Option 2: Netlify

**Why Netlify?**
- Great for static sites and serverless functions
- Free tier with generous limits
- Continuous deployment from Git
- Free SSL and CDN

**Free Tier Limits:**
- 100GB bandwidth/month
- 300 build minutes/month
- 125K serverless function invocations/month

**Steps to Deploy:**

1. **Push code to GitHub** (same as Vercel)

2. **Sign up for Netlify**
   - Go to [netlify.com](https://netlify.com)
   - Sign up with GitHub

3. **Create new site**
   - Click "Add new site" → "Import an existing project"
   - Connect your GitHub repository

4. **Configure build settings**
   - Build command: `pnpm build`
   - Publish directory: `.next`
   - Base directory: (leave empty)

5. **Add environment variables**
   - Go to Site settings → Environment variables
   - Add all required variables

6. **Create `netlify.toml`** (optional):
   ```toml
   [build]
     command = "pnpm build"
     publish = ".next"
   
   [build.environment]
     NODE_VERSION = "20"
   
   [[plugins]]
     package = "@netlify/plugin-nextjs"
   ```

7. **Deploy**
   - Click "Deploy site"
   - Your app will be live at `your-project.netlify.app`

---

### Option 3: Render

**Why Render?**
- Full-stack support
- Free PostgreSQL database included
- Automatic SSL
- Docker support

**Free Tier Limits:**
- 750 hours/month (enough for 24/7 operation)
- 512MB RAM
- Free PostgreSQL database (90 days, then $7/month)

**Steps to Deploy:**

1. **Push code to GitHub**

2. **Sign up for Render**
   - Go to [render.com](https://render.com)
   - Sign up with GitHub

3. **Create a Web Service**
   - Click "New" → "Web Service"
   - Connect your GitHub repository

4. **Configure service**
   - Name: `smart-notes`
   - Environment: `Node`
   - Build Command: `pnpm install && pnpm build`
   - Start Command: `pnpm start`
   - Plan: Free

5. **Create PostgreSQL Database**
   - Click "New" → "PostgreSQL"
   - Name: `smart-notes-db`
   - Plan: Free (or Starter for production)
   - Copy the Internal Database URL

6. **Add environment variables**
   - In your Web Service settings, add:
     - `DATABASE_URL` (from PostgreSQL service)
     - `DIRECT_URL` (same as DATABASE_URL for Render)
     - All Supabase and OpenAI variables

7. **Run migrations**
   - In Render shell or locally:
     ```bash
     pnpm dlx prisma migrate deploy
     ```

8. **Deploy**
   - Render will automatically deploy
   - Your app will be live at `your-project.onrender.com`

---

### Option 4: Railway

**Why Railway?**
- Simple deployment
- Free PostgreSQL included
- $5 free credit monthly
- Great developer experience

**Free Tier:**
- $5 credit/month (enough for small apps)
- Free PostgreSQL database

**Steps to Deploy:**

1. **Push code to GitHub**

2. **Sign up for Railway**
   - Go to [railway.app](https://railway.app)
   - Sign up with GitHub

3. **Create new project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository

4. **Add PostgreSQL**
   - Click "+ New" → "Database" → "PostgreSQL"
   - Railway will provide connection strings

5. **Configure environment variables**
   - Add all required variables
   - Use Railway's PostgreSQL connection strings for `DATABASE_URL` and `DIRECT_URL`

6. **Configure build**
   - Railway auto-detects Next.js
   - Build command: `pnpm build`
   - Start command: `pnpm start`

7. **Run migrations**
   - Use Railway's CLI or add to build:
     ```bash
     pnpm dlx prisma migrate deploy
     ```

8. **Deploy**
   - Railway auto-deploys on push
   - Your app will be live at `your-project.up.railway.app`

---

## 🗄️ Database Setup

### Using Supabase PostgreSQL (Recommended)

1. **Create Supabase project**
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Wait for database to be ready

2. **Get connection strings**
   - Go to Project Settings → Database
   - Copy "Connection string" (URI format)
   - Use for `DATABASE_URL`
   - For `DIRECT_URL`, use the same or connection pooler URL

3. **Run migrations**
   ```bash
   # Set environment variables
   export DATABASE_URL="your-connection-string"
   export DIRECT_URL="your-direct-connection-string"
   
   # Generate Prisma client
   pnpm dlx prisma generate
   
   # Run migrations
   pnpm dlx prisma migrate deploy
   ```

### Using Render/Railway PostgreSQL

- Both platforms provide PostgreSQL databases
- Use their provided connection strings
- Run migrations the same way

---

## 🔧 Post-Deployment Checklist

- [ ] All environment variables are set
- [ ] Database migrations have been run
- [ ] Prisma client has been generated
- [ ] Supabase authentication is configured
- [ ] OpenAI API key is set
- [ ] Custom domain is configured (optional)
- [ ] SSL certificate is active (automatic on most platforms)
- [ ] Test authentication flow
- [ ] Test database operations
- [ ] Test AI features

---

## 🐛 Troubleshooting

### Build Fails

**Error: Prisma Client not generated**
- Add `prisma generate` to your build command
- Or add `"postinstall": "prisma generate"` to package.json

**Error: Database connection failed**
- Check `DATABASE_URL` and `DIRECT_URL` are correct
- Ensure database is accessible from deployment platform
- Check firewall settings

### Runtime Errors

**Error: Missing environment variables**
- Double-check all variables are set in deployment platform
- Ensure variables are set for the correct environment (Production/Preview)

**Error: Supabase authentication fails**
- Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Check Supabase project settings
- Verify redirect URLs in Supabase dashboard

---

## 📊 Comparison Table

| Platform | Best For | Free Tier | Database | Ease of Use |
|----------|----------|-----------|----------|-------------|
| **Vercel** | Next.js apps | Excellent | External (Supabase) | ⭐⭐⭐⭐⭐ |
| **Netlify** | Static + Serverless | Good | External | ⭐⭐⭐⭐ |
| **Render** | Full-stack apps | Good | Included | ⭐⭐⭐⭐ |
| **Railway** | Full-stack apps | Limited ($5/mo) | Included | ⭐⭐⭐⭐⭐ |

---

## 🎯 Recommendation

**For this Next.js project, we recommend Vercel** because:
1. Optimized specifically for Next.js
2. Zero-configuration deployment
3. Best performance and developer experience
4. Free tier is generous for personal projects
5. Easy integration with Supabase (which you're already using)

---

## 📚 Additional Resources

- [Vercel Next.js Deployment](https://vercel.com/docs/frameworks/nextjs)
- [Supabase Documentation](https://supabase.com/docs)
- [Prisma Deployment Guide](https://www.prisma.io/docs/guides/deployment)
- [Next.js Deployment Documentation](https://nextjs.org/docs/app/building-your-application/deploying)

---

## 🆘 Need Help?

If you encounter issues:
1. Check platform-specific documentation
2. Review build logs in your deployment platform
3. Verify all environment variables are set correctly
4. Ensure database migrations have run successfully

