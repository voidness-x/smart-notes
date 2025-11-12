# Environment Variables Checklist

## ✅ Check These in Vercel:

Go to: **Vercel Dashboard → Your Project → Settings → Environment Variables**

### Required Variables (Production, Preview, Development):

1. **`NEXT_PUBLIC_SUPABASE_URL`**
   - Get from: Supabase → Settings → API → Project URL
   - Example: `https://xxxxx.supabase.co`
   - ✅ Set for: Production, Preview, Development

2. **`NEXT_PUBLIC_SUPABASE_ANON_KEY`**
   - Get from: Supabase → Settings → API → anon public key
   - Example: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - ✅ Set for: Production, Preview, Development

3. **`SUPABASE_URL`**
   - Same as NEXT_PUBLIC_SUPABASE_URL
   - ✅ Set for: Production, Preview, Development

4. **`SUPABASE_ANON_KEY`**
   - Same as NEXT_PUBLIC_SUPABASE_ANON_KEY
   - ✅ Set for: Production, Preview, Development

5. **`DATABASE_URL`**
   - Get from: Supabase → Settings → Database → Connection string
   - Use: **URI** format
   - Example: `postgresql://postgres:[PASSWORD]@db.xxxxx.supabase.co:5432/postgres?sslmode=require`
   - **Replace `[PASSWORD]` with your database password**
   - ✅ Set for: Production, Preview, Development

6. **`DIRECT_URL`**
   - Same as DATABASE_URL (or direct connection string)
   - ✅ Set for: Production, Preview, Development

7. **`OPENAI_API_KEY`**
   - Get from: https://platform.openai.com/api-keys
   - Example: `sk-...`
   - ✅ Set for: Production, Preview, Development

## 🔍 How to Get Database Password:

1. Go to Supabase → Settings → Database
2. Look for **Database password** section
3. If you don't know it, click **Reset database password**
4. Copy the new password
5. Use it in DATABASE_URL

## 🔍 How to Get Connection String:

1. Go to Supabase → Settings → Database
2. Scroll to **Connection string** section
3. Click **URI** tab
4. Copy the connection string
5. Replace `[YOUR-PASSWORD]` with your actual password
6. Use it for DATABASE_URL and DIRECT_URL

## ✅ After Adding Variables:

1. Click **Save**
2. Go to **Deployments** tab
3. Click **Redeploy** on latest deployment
4. Wait for deployment to complete
5. Test your app

## 🐛 Common Issues:

### Issue: "Missing environment variable"
**Fix:** Make sure variable is set for Production, Preview, AND Development

### Issue: "Database connection failed"
**Fix:** 
- Check DATABASE_URL is correct
- Make sure password is correct
- Use connection pooler URL if available

### Issue: "Invalid Supabase URL"
**Fix:**
- Check NEXT_PUBLIC_SUPABASE_URL is correct
- Make sure it starts with `https://`
- Make sure it doesn't end with `/`

