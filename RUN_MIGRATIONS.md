# Run Database Migrations - Step by Step

## ✅ Step 1: Run Migrations in Supabase SQL Editor

### Option A: Using Supabase SQL Editor (Easiest - Recommended)

1. **Go to Supabase Dashboard:**
   - Open https://app.supabase.com
   - Select your project

2. **Open SQL Editor:**
   - Click **SQL Editor** in the left sidebar
   - Click **New Query**

3. **Run Migrations in Order:**
   Copy and paste each migration file content in order:

   **Migration 1: Initial Schema** (from `20250924050430_init/migration.sql`)
   ```sql
   -- CreateTable
   CREATE TABLE "public"."Notes" (
       "id" TEXT NOT NULL,
       "text" TEXT NOT NULL,
       "authorId" TEXT NOT NULL,
       "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
       "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
       CONSTRAINT "Notes_pkey" PRIMARY KEY ("id")
   );

   -- CreateTable
   CREATE TABLE "public"."User" (
       "id" TEXT NOT NULL,
       "email" TEXT NOT NULL,
       "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
       "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
       CONSTRAINT "User_pkey" PRIMARY KEY ("id")
   );

   -- CreateIndex
   CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

   -- AddForeignKey
   ALTER TABLE "public"."Notes" ADD CONSTRAINT "Notes_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
   ```
   Click **Run** ✅

   **Migration 2: Rename Notes to Note** (from `20250924210627_rename_notes_to_not/migration.sql`)
   ```sql
   -- DropForeignKey
   ALTER TABLE "public"."Notes" DROP CONSTRAINT "Notes_authorId_fkey";

   -- DropTable
   DROP TABLE "public"."Notes";

   -- CreateTable
   CREATE TABLE "public"."Note" (
       "id" TEXT NOT NULL,
       "text" TEXT NOT NULL,
       "authorId" TEXT NOT NULL,
       "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
       "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
       CONSTRAINT "Note_pkey" PRIMARY KEY ("id")
   );

   -- AddForeignKey
   ALTER TABLE "public"."Note" ADD CONSTRAINT "Note_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
   ```
   Click **Run** ✅

   **Migration 3: Add Tags** (from `20251105200127_add_tags/migration.sql`)
   ```sql
   ALTER TABLE "Note" ADD COLUMN "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];
   ```
   Click **Run** ✅

   **Migration 4: Add Title** (from `20251105200530_add_title/migration.sql`)
   ```sql
   ALTER TABLE "Note" ADD COLUMN "title" TEXT DEFAULT '';
   ```
   Click **Run** ✅

   **Migration 5: Add Collaboration** (from `20251106120402_add_collaboration/migration.sql`)
   ```sql
   ALTER TABLE "Note" ADD COLUMN "isCollaborative" BOOLEAN NOT NULL DEFAULT false;
   ```
   Click **Run** ✅

   **Migration 6: Add Avatar URL** (from `20251106130000_add_avatar_url/migration.sql`)
   ```sql
   ALTER TABLE "User" ADD COLUMN "avatarUrl" TEXT;
   ```
   Click **Run** ✅

   **Migration 7: Add User Name** (from `20251106163838_add_user_name/migration.sql`)
   ```sql
   ALTER TABLE "User" ADD COLUMN "name" TEXT;
   ```
   Click **Run** ✅

   **Migration 8: Add Collaboration Feature** (from `20251107000000_add_collaboration_feature/migration.sql`)
   ```sql
   -- CreateTable: Create the many-to-many relation table for Note collaborators
   CREATE TABLE "_NoteCollaborators" (
       "A" TEXT NOT NULL,
       "B" TEXT NOT NULL,
       CONSTRAINT "_NoteCollaborators_AB_pkey" PRIMARY KEY ("A","B")
   );

   -- CreateIndex
   CREATE INDEX "_NoteCollaborators_B_index" ON "_NoteCollaborators"("B");

   -- AddForeignKey
   ALTER TABLE "_NoteCollaborators" ADD CONSTRAINT "_NoteCollaborators_A_fkey" FOREIGN KEY ("A") REFERENCES "Note"("id") ON DELETE CASCADE ON UPDATE CASCADE;

   -- AddForeignKey
   ALTER TABLE "_NoteCollaborators" ADD CONSTRAINT "_NoteCollaborators_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

   -- CreateTable: Create CollaborationInvite table
   CREATE TABLE "CollaborationInvite" (
       "id" TEXT NOT NULL,
       "noteId" TEXT NOT NULL,
       "senderId" TEXT NOT NULL,
       "receiverId" TEXT,
       "inviteToken" TEXT NOT NULL,
       "status" TEXT NOT NULL DEFAULT 'pending',
       "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
       "expiresAt" TIMESTAMP(3) NOT NULL,
       CONSTRAINT "CollaborationInvite_pkey" PRIMARY KEY ("id")
   );

   -- CreateIndex
   CREATE UNIQUE INDEX "CollaborationInvite_inviteToken_key" ON "CollaborationInvite"("inviteToken");

   -- CreateIndex
   CREATE INDEX "CollaborationInvite_receiverId_idx" ON "CollaborationInvite"("receiverId");

   -- CreateIndex
   CREATE INDEX "CollaborationInvite_inviteToken_idx" ON "CollaborationInvite"("inviteToken");

   -- CreateIndex
   CREATE INDEX "CollaborationInvite_status_idx" ON "CollaborationInvite"("status");

   -- AddForeignKey
   ALTER TABLE "CollaborationInvite" ADD CONSTRAINT "CollaborationInvite_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "Note"("id") ON DELETE CASCADE ON UPDATE CASCADE;

   -- AddForeignKey
   ALTER TABLE "CollaborationInvite" ADD CONSTRAINT "CollaborationInvite_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

   -- AddForeignKey
   ALTER TABLE "CollaborationInvite" ADD CONSTRAINT "CollaborationInvite_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
   ```
   Click **Run** ✅

   **Migration 9: Add Reviews** (from `20251107010000_add_reviews/migration.sql`)
   ```sql
   -- CreateTable
   CREATE TABLE "Review" (
       "id" TEXT NOT NULL,
       "userId" TEXT NOT NULL,
       "rating" INTEGER NOT NULL,
       "comment" TEXT,
       "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
       "updatedAt" TIMESTAMP(3) NOT NULL,
       CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
   );

   -- CreateTable
   CREATE TABLE "ReviewReply" (
       "id" TEXT NOT NULL,
       "reviewId" TEXT NOT NULL,
       "userId" TEXT NOT NULL,
       "comment" TEXT NOT NULL,
       "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
       "updatedAt" TIMESTAMP(3) NOT NULL,
       CONSTRAINT "ReviewReply_pkey" PRIMARY KEY ("id")
   );

   -- CreateIndex
   CREATE INDEX "Review_userId_idx" ON "Review"("userId");

   -- CreateIndex
   CREATE INDEX "Review_createdAt_idx" ON "Review"("createdAt");

   -- CreateIndex
   CREATE INDEX "ReviewReply_reviewId_idx" ON "ReviewReply"("reviewId");

   -- CreateIndex
   CREATE INDEX "ReviewReply_userId_idx" ON "ReviewReply"("userId");

   -- AddForeignKey
   ALTER TABLE "Review" ADD CONSTRAINT "Review_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

   -- AddForeignKey
   ALTER TABLE "ReviewReply" ADD CONSTRAINT "ReviewReply_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "Review"("id") ON DELETE CASCADE ON UPDATE CASCADE;

   -- AddForeignKey
   ALTER TABLE "ReviewReply" ADD CONSTRAINT "ReviewReply_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
   ```
   Click **Run** ✅

   **Migration 10: Add User Role and Last Active** (from `20251111233733_add_user_role_and_last_active/migration.sql`)
   ```sql
   ALTER TABLE "User" ADD COLUMN "role" TEXT NOT NULL DEFAULT 'user';
   ALTER TABLE "User" ADD COLUMN "lastActiveAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;
   ALTER TABLE "User" ADD COLUMN "blocked" BOOLEAN NOT NULL DEFAULT false;

   CREATE INDEX "User_role_idx" ON "User"("role");
   CREATE INDEX "User_blocked_idx" ON "User"("blocked");
   ```
   Click **Run** ✅

   **Migration 11: Add Support Tickets** (from `20251112010545_add_support_tickets/migration.sql`)
   ```sql
   -- CreateTable
   CREATE TABLE "SupportTicket" (
       "id" TEXT NOT NULL,
       "userId" TEXT NOT NULL,
       "email" TEXT NOT NULL,
       "title" TEXT NOT NULL,
       "description" TEXT NOT NULL,
       "photoUrl" TEXT,
       "status" TEXT NOT NULL DEFAULT 'sent',
       "handledById" TEXT,
       "handledAt" TIMESTAMP(3),
       "solution" TEXT,
       "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
       "updatedAt" TIMESTAMP(3) NOT NULL,
       "satisfied" BOOLEAN,
       CONSTRAINT "SupportTicket_pkey" PRIMARY KEY ("id")
   );

   -- CreateIndex
   CREATE INDEX "SupportTicket_userId_idx" ON "SupportTicket"("userId");

   -- CreateIndex
   CREATE INDEX "SupportTicket_status_idx" ON "SupportTicket"("status");

   -- CreateIndex
   CREATE INDEX "SupportTicket_handledById_idx" ON "SupportTicket"("handledById");

   -- AddForeignKey
   ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

   -- AddForeignKey
   ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_handledById_fkey" FOREIGN KEY ("handledById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
   ```
   Click **Run** ✅

   **Migration 12: Remove Unused Columns** (from `20251112040111_remove_unused_isShared_column_and_table/migration.sql`)
   ```sql
   -- This migration removes unused columns/tables - run if they exist
   -- (Skip if tables/columns don't exist - it's safe)
   ```
   Click **Run** ✅ (or skip if no errors)

4. **Verify Tables Created:**
   - Go to **Table Editor** in Supabase
   - Check if these tables exist:
     - ✅ `User`
     - ✅ `Note`
     - ✅ `Review`
     - ✅ `ReviewReply`
     - ✅ `CollaborationInvite`
     - ✅ `SupportTicket`
     - ✅ `_NoteCollaborators`

### Option B: Using Vercel CLI (Alternative)

```powershell
# Install Vercel CLI (if not installed)
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

## ✅ Step 2: Verify Migrations

After running migrations:

1. **Check Supabase Table Editor:**
   - Go to Supabase → **Table Editor**
   - Verify all tables exist

2. **Test Your App:**
   - Go to your Vercel URL
   - Try logging in
   - Check if errors are gone

## ✅ Step 3: Configure Supabase Redirect URLs

1. **Go to Supabase Dashboard:**
   - Click **Authentication** → **URL Configuration**

2. **Add Redirect URLs:**
   - `https://your-project.vercel.app`
   - `https://your-project.vercel.app/auth/confirm`
   - `https://your-project.vercel.app/login`
   - `https://your-project.vercel.app/sign-up`

## 🎉 Done!

After running migrations, your app should work! Try logging in again.

