"use client";

import useNote from "@/hooks/useNote";
import { Note } from "@prisma/client";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { SidebarMenuButton } from "@/components/ui/sidebar";
import Link from "next/link";
import { togglePinAction } from "@/actions/notes";
import { Star, StarOff, Tag as TagIcon } from "lucide-react";

type Props = {
  note: Note;
  onTogglePin?: (noteId: string) => void;
};

function SelectNoteButton({ note, onTogglePin }: Props) {
  const noteId = useSearchParams().get("noteId") || "";

  const { noteText: selectedNoteText } = useNote();
  const [shouldUseGlobalNoteText, setShouldUseGlobalNoteText] = useState(false);
  const [localNoteText, setLocalNoteText] = useState(note.text);

  useEffect(() => {
    if (noteId === note.id) {
      setShouldUseGlobalNoteText(true);
    } else {
      setShouldUseGlobalNoteText(false);
    }
  }, [noteId, note.id]);

  useEffect(() => {
    if (shouldUseGlobalNoteText) {
      setLocalNoteText(selectedNoteText);
    }
  }, [selectedNoteText, shouldUseGlobalNoteText]);

  // Strip HTML tags from note text for display
  // Safe: Only extracts text content, doesn't render HTML
  // Note: TipTap editor generates safe HTML, and we only extract text for display
  const stripHtml = (html: string) => {
    if (!html) return "";
    // Use regex to strip all HTML tags (safe for display purposes)
    // This is safe because we're only displaying the text, not rendering HTML
    return html.replace(/<[^>]*>/g, "").trim();
  };

  // Format date consistently to prevent hydration mismatch
  // Use manual formatting to avoid locale/timezone differences
  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const year = d.getFullYear();
    const month = months[d.getMonth()];
    const day = d.getDate();
    return `${month} ${day}, ${year}`;
  };

  // Get title from note, fallback to extracted text if no title
  const noteTitle = (note as any).title && (note as any).title.trim() 
    ? (note as any).title 
    : null;

  const blankNoteText = "EMPTY NOTE";
  let rawNoteText = localNoteText || blankNoteText;
  if (shouldUseGlobalNoteText) {
    rawNoteText = selectedNoteText || blankNoteText;
  }
  
  // Strip HTML and get plain text
  const noteText = rawNoteText === blankNoteText ? blankNoteText : stripHtml(rawNoteText);
  
  // Use title if available, otherwise use extracted text
  const displayText = noteTitle || noteText;

  const isCollaborative = (note as any).isCollaborative || false;

  return (
    <SidebarMenuButton
      asChild
      className={`items-start gap-0 pr-12 transition-shadow ${note.id === noteId && "bg-sidebar-accent/50"} hover:shadow-md`}
    >
      <Link href={`/notes?noteId=${note.id}`} className="flex h-fit flex-col">
        <p className="w-full overflow-hidden truncate text-ellipsis whitespace-nowrap flex items-center gap-1">
          {/* Green dot for collaborative notes */}
          {isCollaborative && (
            <span className="h-2 w-2 rounded-full bg-green-500 flex-shrink-0" />
          )}
          <button
            onClick={async (e) => {
              e.preventDefault();
              // optimistic local toggle
              onTogglePin?.(note.id);
              try {
                const result = await togglePinAction(note.id);
                if (result.errorMessage) {
                  // revert on failure
                  onTogglePin?.(note.id);
                }
              } catch {
                // revert on failure
                onTogglePin?.(note.id);
              }
            }}
            className="text-muted-foreground hover:text-yellow-400 px-1"
          >
            {note.pinned ? <Star className="w-4 h-4" /> : <StarOff className="w-4 h-4" />}
          </button>
          {displayText}
        </p>
        <div className="flex items-center gap-2 flex-wrap mt-1">
          {(note as any).tags && (note as any).tags.length > 0 && (
            <div className="flex items-center gap-1 flex-wrap">
              {(note as any).tags.slice(0, 3).map((tag: string) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs bg-primary/10 text-primary"
                >
                  <TagIcon className="h-2.5 w-2.5" />
                  {tag}
                </span>
              ))}
              {(note as any).tags.length > 3 && (
                <span className="text-xs text-muted-foreground">+{(note as any).tags.length - 3}</span>
              )}
            </div>
          )}
          <p className="text-muted-foreground text-xs">
            {formatDate(note.updatedAt)}
          </p>
        </div>
      </Link>
    </SidebarMenuButton>
  );
}

export default SelectNoteButton;