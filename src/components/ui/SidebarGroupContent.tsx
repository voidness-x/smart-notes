'use client';

import { SidebarGroupContent as SidebarGroupContentCN } from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { Button } from "./button";
import {
  SearchIcon,
  Tag as TagIcon,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import Fuse from "fuse.js";
import { useSearchParams } from "next/navigation";
import useNote from "@/hooks/useNote";
import SelectNoteButton from "./SelectNoteButton";
import DeleteNoteButton from "./DeleteNoteButton";
import { Note } from "@prisma/client";

type Props = {
  notes: Note[];
};

function SidebarGroupContent({ notes }: Props) {
  const searchParams = useSearchParams();
  const noteIdParam = searchParams.get("noteId") || "";

  const [searchText, setSearchText] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const { noteText, noteTitle, noteTags } = useNote();

  const [localNotes, setLocalNotes] = useState<Note[]>(notes);

  useEffect(() => {
    setLocalNotes(notes);
  }, [notes]);

  const prevNoteIdRef = useRef<string>("");

  useEffect(() => {
    if (!noteIdParam) return;
    const isSwitchingNotes = prevNoteIdRef.current !== "" && prevNoteIdRef.current !== noteIdParam;
    prevNoteIdRef.current = noteIdParam;

    setLocalNotes((prev) =>
      prev.map((note) => {
        if (note.id !== noteIdParam) return note;
        const updated: Note = {
          ...note,
          updatedAt: new Date(),
        };
        if (noteText !== undefined && noteText !== "") {
          updated.text = noteText;
        }
        if (!isSwitchingNotes && noteTitle !== undefined && noteTitle !== null) {
          updated.title = noteTitle;
        }
        if (!isSwitchingNotes && noteTags !== undefined && Array.isArray(noteTags)) {
          updated.tags = noteTags;
        }
        return updated;
      })
    );
  }, [noteText, noteTitle, noteTags, noteIdParam]);

  const fuse = useMemo(() => {
    return new Fuse(localNotes, {
      keys: ["title", "text", "tags"],
      threshold: 0.4,
    });
  }, [localNotes]);

  const filteredNotes = useMemo(() => {
    let filtered = localNotes;
    if (selectedTag) {
      filtered = filtered.filter((note) => note.tags?.includes(selectedTag));
    }
    if (searchText) {
      const searchResults = fuse.search(searchText).map((result) => result.item.id);
      filtered = filtered.filter((note) => searchResults.includes(note.id));
    }
    return filtered;
  }, [localNotes, selectedTag, searchText, fuse]);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    localNotes.forEach((note) => {
      note.tags?.forEach((tag) => set.add(tag));
    });
    return Array.from(set).sort();
  }, [localNotes]);

  return (
    <SidebarGroupContentCN className="flex h-full flex-col gap-3">
      <div className="relative flex items-center">
        <SearchIcon className="absolute left-2 size-4 text-muted-foreground" />
        <Input
          className="bg-muted pl-8"
          placeholder="Search your notes..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
      </div>

      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-1">
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
          {allTags
            .filter((tag) => tag !== selectedTag)
            .map((tag) => (
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

      <div className="space-y-1 overflow-y-auto pb-4">
        {filteredNotes.map((note) => (
          <div
            key={note.id}
            className="group group/item relative flex items-center justify-between rounded-md border border-transparent px-2 py-1 hover:border-border"
          >
            <SelectNoteButton note={note} />
            <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
              <DeleteNoteButton noteId={note.id} />
            </div>
          </div>
        ))}
        {filteredNotes.length === 0 && (
          <p className="text-sm text-muted-foreground">No notes match the current filters.</p>
        )}
      </div>
    </SidebarGroupContentCN>
  );
}

export default SidebarGroupContent;