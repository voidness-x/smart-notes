-- AlterTable
ALTER TABLE "Note" ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];
