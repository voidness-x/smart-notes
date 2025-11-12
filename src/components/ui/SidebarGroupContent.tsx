"use client";

import { Note } from "@prisma/client";
import { SidebarGroupContent as SidebarGroupContentCN, SidebarMenu, SidebarMenuItem } from "@/components/ui/sidebar";
import { SearchIcon, X, Tag as TagIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useEffect, useMemo, useState, useRef } from "react";
import Fuse from "fuse.js";
import SelectNoteButton from "./SelectNoteButton";
import DeleteNoteButton from "./DeleteNoteButton";
import useNote from "@/hooks/useNote";
import { useSearchParams } from "next/navigation";
import { Button } from "./button";

type Props = {
  notes: Note[];
};

function SidebarGroupContent({ notes }: Props) {
  const [searchText, setSearchText] = useState("");
  const [localNotes, setLocalNotes] = useState(notes);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // get current noteId and live noteText/noteTitle/noteTags from the editor
  const noteIdParam = useSearchParams().get("noteId") || "";
  const { noteText, noteTitle, noteTags } = useNote();

  // Get all unique tags from notes
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    localNotes.forEach(note => {
      const tags = (note as any).tags;
      if (tags && Array.isArray(tags)) {
        tags.forEach((tag: string) => tagSet.add(tag));
      }
    });
    return Array.from(tagSet).sort();
  }, [localNotes]);

  useEffect(() => {
    setLocalNotes(notes);
  }, [notes]);

  // Track the previous noteId to detect note switches
  const prevNoteIdRef = useRef<string>("");
  
  // whenever the active note text, title, or tags changes, update locally
  useEffect(() => {
    if (!noteIdParam) {
      // Clear global state when no note is selected
      return;
    }
    
    // Detect if we're switching notes
    const isSwitchingNotes = prevNoteIdRef.current !== "" && prevNoteIdRef.current !== noteIdParam;
    prevNoteIdRef.current = noteIdParam;
    
    setLocalNotes((prev) =>
      prev.map((n) => {
        if (n.id === noteIdParam) {
          const updated: any = { ...n, updatedAt: new Date() };
          // Only update text if noteText is not empty (to avoid clearing on note switch)
          if (noteText !== undefined && noteText !== "") {
            updated.text = noteText;
          }
          // Only update title if we're not switching notes (user is actively editing)
          // Since all notes now have "No title" as default, we can safely update
          if (!isSwitchingNotes && noteTitle !== undefined && noteTitle !== null) {
            updated.title = noteTitle;
          }
          // Update tags if we're not switching notes (user is actively editing)
          if (!isSwitchingNotes && noteTags !== undefined && Array.isArray(noteTags)) {
            updated.tags = noteTags;
          }
          return updated;
        }
        return n;
      })
    );
  }, [noteText, noteTitle, noteTags, noteIdParam]);

  const fuse = useMemo(() => {
    return new Fuse(localNotes, {
      keys: ["text", "tags"],
      threshold: 0.4,
    });
  }, [localNotes]);

  const filteredNotes = useMemo(() => {
    let filtered = localNotes;

    // Filter by tag first
    if (selectedTag) {
      filtered = filtered.filter(note => {
        const tags = (note as any).tags;
        return tags && Array.isArray(tags) && tags.includes(selectedTag);
      });
    }

    // Then filter by search text
    if (searchText) {
      const searchResults = fuse.search(searchText).map((result) => result.item);
      filtered = filtered.filter(note => 
        searchResults.some(result => result.id === note.id)
      );
    }

    return filtered;
  }, [localNotes, selectedTag, searchText, fuse]);

  const sortNotes = (a: Note, b: Note) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return b.updatedAt.getTime() - a.updatedAt.getTime();
  };

  const displayNotes = useMemo(() => {
    return [...filteredNotes].sort(sortNotes);
  }, [filteredNotes]);

  const deleteNoteLocally = (noteId: string) => {
    setLocalNotes((prevNotes) => prevNotes.filter((note) => note.id !== noteId));
  };

  const togglePinLocally = (noteId: string) => {
    setLocalNotes((prevNotes) =>
      prevNotes.map((n) => (n.id === noteId ? { ...n, pinned: !n.pinned } : n))
    );
  };

  return (
    <SidebarGroupContentCN>
      <div className="relative flex items-center mb-2">
        <SearchIcon className="absolute left-2 size-4" />
        <Input
          className="bg-muted pl-8"
          placeholder="Search your notes..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
      </div>

      {/* Tag Filter */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {selectedTag && (
            <Button
              variant="default"
              size="sm"
              onClick={() => setSelectedTag(null)}
              className="h-6 text-xs px-2"
            >
              {selectedTag}
              <X className="h-3 w-3 ml-1" />
            </Button>
          )}
          {allTags.filter(tag => tag !== selectedTag).map((tag) => (
            <Button
              key={tag}
              variant="outline"
              size="sm"
              onClick={() => setSelectedTag(tag)}
              className="h-6 text-xs px-2"
            >
              <TagIcon className="h-3 w-3 mr-1" />
              {tag}
            </Button>
          ))}
        </div>
      )}

      <SidebarMenu className="mt-4 ">
        {displayNotes.map((note) => (
          <SidebarMenuItem key={note.id} className="group/item">
            <SelectNoteButton note={note} onTogglePin={togglePinLocally} />
            <DeleteNoteButton
              noteId={note.id}
              deleteNoteLocally={deleteNoteLocally}
            />
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroupContentCN>
  );
}

export default SidebarGroupContent;