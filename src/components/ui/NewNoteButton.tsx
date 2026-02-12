"use client";

import { User } from "@supabase/supabase-js";
import { Button } from "./button";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import { createNoteAction } from "@/actions/notes";
import { toast } from "sonner"

type Props = {
  user: User | null;
};

function NewNoteButton({ user }: Props) {

  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleClickNewNoteButton = async () => {
    if (!user) {
      router.push("/login")
    } else {
      setLoading(true);

      const uuid = uuidv4();
      await createNoteAction(uuid);
      router.push(`/notes?noteId=${uuid}`);
      router.refresh();

      toast.success("New Note Created", {
        description: "Your new note is ready!",
      });

      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleClickNewNoteButton}
      variant="secondary"
      className="w-24"
      disabled={loading}
    >
      {loading ? <Loader2 className="aimate-spin" /> : "New Note"}
    </Button>
  );
}

export default NewNoteButton;