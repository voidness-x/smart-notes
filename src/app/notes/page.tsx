import { getUser } from "@/auth/server";
import AskAIButton from "@/components/ui/AskAIButton";
import NewNoteButton from "@/components/ui/NewNoteButton";
import NoteTextInput from "@/components/ui/NoteTextInput";
import CollabButton from "@/components/ui/CollabButton";
import { prisma } from "@/db/prisma";
import { acceptInviteByTokenAction } from "@/actions/collaboration";
import { redirect } from "next/navigation";
import { isValidUUID } from "@/lib/security";

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
  
  // Validate noteId format if provided
  let note = null;
  if (noteId && user) {
    // Validate UUID format to prevent invalid queries
    if (!isValidUUID(noteId)) {
      // Invalid noteId format - treat as if note doesn't exist
      note = null;
    } else {
      // Find note - either user is author or collaborator
      note = await prisma.note.findFirst({
        where: {
          id: noteId,
          OR: [
            { authorId: user.id },
            { collaborators: { some: { id: user.id } } },
          ],
        },
      });
    }
  }

  const isCollaborative = note ? (note as any).isCollaborative || false : false;
  const isAuthor = note ? note.authorId === user?.id : false;
  
  return (
    
    <div className="flex h-full flex-col items-center gap-4 w-full">
      <div className="flex w-full max-w-4xl justify-end gap-2 flex-wrap">
        {noteId && isAuthor && (
          <CollabButton noteId={noteId} isCollaborative={isCollaborative} />
        )}
        <AskAIButton user={user} />
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