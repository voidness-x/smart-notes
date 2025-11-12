-- AlterTable: Add isCollaborative field to Note
ALTER TABLE "Note" ADD COLUMN "isCollaborative" BOOLEAN NOT NULL DEFAULT false;

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

