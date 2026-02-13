"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2 } from "lucide-react";
import { useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { deleteNoteAction } from "@/actions/notes";
import { Note } from "@prisma/client";

type Props = {
  noteId: string;
  deleteNoteLocally?: (noteId: string) => void;
  allNotes?: Note[];
};

function DeleteNoteButton({ noteId, deleteNoteLocally, allNotes }: Props) {
  const router = useRouter();
  const noteIdParam = useSearchParams().get("noteId") || "";

  const [isPending, startTransition] = useTransition();

  const handleDeleteNote = () => {
    startTransition(async () => {
      // Optimistically remove from sidebar immediately
      deleteNoteLocally?.(noteId);

      const { errorMessage } = await deleteNoteAction(noteId);

      if (!errorMessage) {
        toast.success("Note Deleted", {
          description: "You have successfully deleted the note",
        });

        // If we deleted the active note, navigate to the next one
        if (noteId === noteIdParam && allNotes) {
          const remaining = allNotes.filter((n) => n.id !== noteId);
          if (remaining.length > 0) {
            // Navigate to the most recently updated remaining note
            const sorted = [...remaining].sort(
              (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
            );
            router.push(`/notes?noteId=${sorted[0].id}`);
          } else {
            // No notes left — stay on blank /notes page
            router.push("/notes");
          }
        }
      } else {
        toast.error("Error", {
          description: errorMessage,
        });
      }
    });
  };
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          className="absolute right-2 top-1/2 size-7 -translate-y-1/2 p-0 opacity-0 group-hover/item:opacity-100 [&_svg]:size-3"
          variant="ghost"
        >
          <Trash2 />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Are you sure you want to delete this note?
          </AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete your note
            from our servers.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDeleteNote}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 w-24"
          >
            {isPending ? <Loader2 className="animate-spin" /> : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default DeleteNoteButton;