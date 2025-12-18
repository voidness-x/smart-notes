"use client";

import { ChangeEvent, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "./button";
import { importPdfNoteAction } from "@/actions/notes";
import { toast } from "sonner";
import { User } from "@supabase/supabase-js";

type Props = {
  user: User | null;
};

export default function ImportPdfButton({ user }: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();

  const handleTrigger = () => {
    if (!user) {
      router.push("/login");
      return;
    }
    inputRef.current?.click();
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      toast.error("Please select a PDF file.");
      event.target.value = "";
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    startTransition(async () => {
      const result = await importPdfNoteAction(formData);
      if (result?.errorMessage) {
        toast.error(result.errorMessage);
        event.target.value = "";
        return;
      }

      toast.success("PDF imported successfully.");
      router.push(`/notes?noteId=${result?.noteId}`);
      event.target.value = "";
    });
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={handleFileChange}
      />
      <Button
        variant="secondary"
        onClick={handleTrigger}
        disabled={isPending}
        className="w-32"
      >
        {isPending ? "Importing..." : "Import PDF"}
      </Button>
    </>
  );
}

