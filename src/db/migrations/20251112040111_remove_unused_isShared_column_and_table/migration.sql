-- Drop the unused isShared column from Note table
ALTER TABLE "Note" DROP COLUMN IF EXISTS "isShared";

-- Drop the unused _SharedNotes table if it exists
-- This table was replaced by _NoteCollaborators in a later migration
DROP TABLE IF EXISTS "_SharedNotes";

-- Drop the unused spotifyUrl column from User table if it exists
-- This column was never fully implemented
ALTER TABLE "User" DROP COLUMN IF EXISTS "spotifyUrl";

-- Clean up duplicate migration records from migration history
-- These were duplicate migrations that have been removed from the codebase
DELETE FROM "_prisma_migrations" 
WHERE "migration_name" IN (
    '20251106162311_add_avatar_url',
    '20251106170000_add_user_name'
);

