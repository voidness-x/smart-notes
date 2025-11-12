-- AlterTable
ALTER TABLE "Note" ADD COLUMN     "isShared" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "_SharedNotes" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_SharedNotes_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_SharedNotes_B_index" ON "_SharedNotes"("B");

-- AddForeignKey
ALTER TABLE "_SharedNotes" ADD CONSTRAINT "_SharedNotes_A_fkey" FOREIGN KEY ("A") REFERENCES "Note"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SharedNotes" ADD CONSTRAINT "_SharedNotes_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
