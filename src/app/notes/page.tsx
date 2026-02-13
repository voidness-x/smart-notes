import { getUser } from "@/auth/server";
import AskAIButton from "@/components/ui/AskAIButton";
import NewNoteButton from "@/components/ui/NewNoteButton";
import NoteTextInput from "@/components/ui/NoteTextInput";
import CollabButton from "@/components/ui/CollabButton";
import ImportPdfButton from "@/components/ui/ImportPdfButton";
import ExportPdfButton from "@/components/ui/ExportPdfButton";
import { prisma } from "@/db/prisma";
import { acceptInviteByTokenAction } from "@/actions/collaboration";
import { redirect } from "next/navigation";
import { isValidUUID } from "@/lib/security";
import { Note } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

async function HomePage({ searchParams }: Props) {
  const params = await searchParams;
  const noteIdParam = params.noteId;
  const inviteToken = params.invite;
  const user = await getUser();

  // Handle invite token
  if (inviteToken && user) {
    const inviteTokenStr = Array.isArray(inviteToken) ? inviteToken[0] : inviteToken;
    const result = await acceptInviteByTokenAction(inviteTokenStr);

    if (!result.errorMessage && result.noteId) {
      redirect(`/notes?noteId=${result.noteId}`);
    }
  }

  const noteId = Array.isArray(noteIdParam) ? noteIdParam[0] : noteIdParam || "";

  // Auto-select latest note or create one if user has no noteId
  if (!noteId && user) {
    try {
      // Find the most recently updated note
      const newestNote = await prisma.note.findFirst({
        where: {
          OR: [
            { authorId: user.id },
            { collaborators: { some: { id: user.id } } },
          ],
        },
        orderBy: { updatedAt: "desc" },
        select: { id: true },
      });

      if (newestNote) {
        redirect(`/notes?noteId=${newestNote.id}`);
      } else {
        // No notes exist — create one and redirect
        const newId = uuidv4();
        await prisma.note.create({
          data: { id: newId, authorId: user.id, text: "", title: "No title" },
        });
        redirect(`/notes?noteId=${newId}`);
      }
    } catch (error) {
      // redirect() throws a special error — rethrow it
      if ((error as any)?.digest?.startsWith("NEXT_REDIRECT")) throw error;
      console.error("Notes page: Error selecting/creating note:", error);
    }
  }

  // Validate noteId format if provided
  let note: Note | null = null;
  if (noteId && user) {
    if (!isValidUUID(noteId)) {
      note = null;
    } else {
      try {
        note = await prisma.note.findFirst({
          where: {
            id: noteId,
            OR: [
              { authorId: user.id },
              { collaborators: { some: { id: user.id } } },
            ],
          },
        });
      } catch (error) {
        console.error("Notes page: Database error fetching note:", error);
        note = null;
      }
    }
  }

  const isCollaborative = note?.isCollaborative ?? false;
  const isAuthor = note ? note.authorId === user?.id : false;

  return (
    <div className="flex h-full flex-col items-center gap-4 w-full">
      <div className="flex w-full max-w-4xl justify-end gap-2 flex-wrap">
        {noteId && isAuthor && (
          <CollabButton noteId={noteId} isCollaborative={isCollaborative} />
        )}
        <AskAIButton user={user} />
        <ExportPdfButton noteId={noteId} user={user} />
        <ImportPdfButton user={user} />
        <NewNoteButton user={user} />
      </div>
      <NoteTextInput
        noteId={noteId}
        startingNoteText={note?.text || ""}
        startingTags={note?.tags || []}
        startingTitle={note?.title || "No title"}
        isCollaborative={isCollaborative}
      />
    </div>
  );
}

export default HomePage;