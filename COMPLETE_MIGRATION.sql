-- Complete Database Migration Script
-- Run this in Supabase SQL Editor to create all tables

-- ============================================
-- STEP 1: Create User Table
-- ============================================
CREATE TABLE IF NOT EXISTS "public"."User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "avatarUrl" TEXT,
    "role" TEXT NOT NULL DEFAULT 'user',
    "lastActiveAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "blocked" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- Create unique index on email
CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "public"."User"("email");

-- Create indexes
CREATE INDEX IF NOT EXISTS "User_role_idx" ON "public"."User"("role");
CREATE INDEX IF NOT EXISTS "User_blocked_idx" ON "public"."User"("blocked");

-- ============================================
-- STEP 2: Create Note Table
-- ============================================
CREATE TABLE IF NOT EXISTS "public"."Note" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "title" TEXT DEFAULT '',
    "isCollaborative" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Note_pkey" PRIMARY KEY ("id")
);

-- Add foreign key (drop first if exists)
ALTER TABLE "public"."Note" DROP CONSTRAINT IF EXISTS "Note_authorId_fkey";

ALTER TABLE "public"."Note" 
ADD CONSTRAINT "Note_authorId_fkey" 
FOREIGN KEY ("authorId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================
-- STEP 3: Create Note Collaborators Table (Many-to-Many)
-- ============================================
CREATE TABLE IF NOT EXISTS "_NoteCollaborators" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_NoteCollaborators_AB_pkey" PRIMARY KEY ("A","B")
);

CREATE INDEX IF NOT EXISTS "_NoteCollaborators_B_index" ON "_NoteCollaborators"("B");

-- Add foreign keys for _NoteCollaborators (drop first if exists)
ALTER TABLE "_NoteCollaborators" DROP CONSTRAINT IF EXISTS "_NoteCollaborators_A_fkey";
ALTER TABLE "_NoteCollaborators" DROP CONSTRAINT IF EXISTS "_NoteCollaborators_B_fkey";

ALTER TABLE "_NoteCollaborators" 
ADD CONSTRAINT "_NoteCollaborators_A_fkey" 
FOREIGN KEY ("A") REFERENCES "public"."Note"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "_NoteCollaborators" 
ADD CONSTRAINT "_NoteCollaborators_B_fkey" 
FOREIGN KEY ("B") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================
-- STEP 4: Create CollaborationInvite Table
-- ============================================
CREATE TABLE IF NOT EXISTS "CollaborationInvite" (
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

CREATE UNIQUE INDEX IF NOT EXISTS "CollaborationInvite_inviteToken_key" ON "CollaborationInvite"("inviteToken");
CREATE INDEX IF NOT EXISTS "CollaborationInvite_receiverId_idx" ON "CollaborationInvite"("receiverId");
CREATE INDEX IF NOT EXISTS "CollaborationInvite_inviteToken_idx" ON "CollaborationInvite"("inviteToken");
CREATE INDEX IF NOT EXISTS "CollaborationInvite_status_idx" ON "CollaborationInvite"("status");

-- Add foreign keys for CollaborationInvite (drop first if exists)
ALTER TABLE "CollaborationInvite" DROP CONSTRAINT IF EXISTS "CollaborationInvite_noteId_fkey";
ALTER TABLE "CollaborationInvite" DROP CONSTRAINT IF EXISTS "CollaborationInvite_senderId_fkey";
ALTER TABLE "CollaborationInvite" DROP CONSTRAINT IF EXISTS "CollaborationInvite_receiverId_fkey";

ALTER TABLE "CollaborationInvite" 
ADD CONSTRAINT "CollaborationInvite_noteId_fkey" 
FOREIGN KEY ("noteId") REFERENCES "public"."Note"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CollaborationInvite" 
ADD CONSTRAINT "CollaborationInvite_senderId_fkey" 
FOREIGN KEY ("senderId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CollaborationInvite" 
ADD CONSTRAINT "CollaborationInvite_receiverId_fkey" 
FOREIGN KEY ("receiverId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ============================================
-- STEP 5: Create Review Table
-- ============================================
CREATE TABLE IF NOT EXISTS "Review" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Review_userId_idx" ON "Review"("userId");
CREATE INDEX IF NOT EXISTS "Review_createdAt_idx" ON "Review"("createdAt");

-- Add foreign key for Review (drop first if exists)
ALTER TABLE "Review" DROP CONSTRAINT IF EXISTS "Review_userId_fkey";

ALTER TABLE "Review" 
ADD CONSTRAINT "Review_userId_fkey" 
FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================
-- STEP 6: Create ReviewReply Table
-- ============================================
CREATE TABLE IF NOT EXISTS "ReviewReply" (
    "id" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "comment" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ReviewReply_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ReviewReply_reviewId_idx" ON "ReviewReply"("reviewId");
CREATE INDEX IF NOT EXISTS "ReviewReply_userId_idx" ON "ReviewReply"("userId");

-- Add foreign keys for ReviewReply (drop first if exists)
ALTER TABLE "ReviewReply" DROP CONSTRAINT IF EXISTS "ReviewReply_reviewId_fkey";
ALTER TABLE "ReviewReply" DROP CONSTRAINT IF EXISTS "ReviewReply_userId_fkey";

ALTER TABLE "ReviewReply" 
ADD CONSTRAINT "ReviewReply_reviewId_fkey" 
FOREIGN KEY ("reviewId") REFERENCES "Review"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ReviewReply" 
ADD CONSTRAINT "ReviewReply_userId_fkey" 
FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================
-- STEP 7: Create SupportTicket Table
-- ============================================
CREATE TABLE IF NOT EXISTS "SupportTicket" (
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
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "satisfied" BOOLEAN,
    CONSTRAINT "SupportTicket_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "SupportTicket_userId_idx" ON "SupportTicket"("userId");
CREATE INDEX IF NOT EXISTS "SupportTicket_status_idx" ON "SupportTicket"("status");
CREATE INDEX IF NOT EXISTS "SupportTicket_handledById_idx" ON "SupportTicket"("handledById");

-- Add foreign keys for SupportTicket (drop first if exists)
ALTER TABLE "SupportTicket" DROP CONSTRAINT IF EXISTS "SupportTicket_userId_fkey";
ALTER TABLE "SupportTicket" DROP CONSTRAINT IF EXISTS "SupportTicket_handledById_fkey";

ALTER TABLE "SupportTicket" 
ADD CONSTRAINT "SupportTicket_userId_fkey" 
FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SupportTicket" 
ADD CONSTRAINT "SupportTicket_handledById_fkey" 
FOREIGN KEY ("handledById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ============================================
-- DONE! Verify tables were created
-- ============================================
-- Check if all tables exist by running:
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' 
-- ORDER BY table_name;

