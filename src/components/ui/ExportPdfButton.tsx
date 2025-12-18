"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "./button";
import { exportNoteAsPdfAction } from "@/actions/notes";
import { toast } from "sonner";
import { User } from "@supabase/supabase-js";
import useNote from "@/hooks/useNote";

type Props = {
  noteId: string;
  user: User | null;
};

export default function ExportPdfButton({ noteId, user }: Props) {
  const router = useRouter();
  const { noteText, noteTitle } = useNote();
  const [isPending, startTransition] = useTransition();

  const handleDownload = () => {
    if (!user) {
      router.push("/login");
      return;
    }

    if (!noteId) {
      toast.error("Create or open a note before exporting.");
      return;
    }

    startTransition(async () => {
      const result = await exportNoteAsPdfAction(noteId, noteTitle, noteText);
      if (result?.errorMessage || !result?.pdfBase64) {
        toast.error(result?.errorMessage || "Failed to export note.");
        return;
      }

      const byteCharacters = atob(result.pdfBase64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }

      const blob = new Blob([new Uint8Array(byteNumbers)], {
        type: "application/pdf",
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = result.fileName || "note.pdf";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast.success("PDF downloaded.");
    });
  };

  return (
    <Button
      variant="secondary"
      onClick={handleDownload}
      disabled={isPending || !noteId}
      className="w-32"
    >
      {isPending ? "Exporting..." : "Export PDF"}
    </Button>
  );
}

