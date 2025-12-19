'use client';

import { SidebarGroupContent as SidebarGroupContentCN } from "@/components/ui/sidebar";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Button } from "./button";
import {
  ChevronsDownUp,
  ChevronDown,
  ChevronRight,
  FolderPlus,
  MoreHorizontal,
  SearchIcon,
  Share2,
  Tag as TagIcon,
  Trash2,
  X,
  Pencil,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Fuse from "fuse.js";
import { useRouter, useSearchParams } from "next/navigation";
import useNote from "@/hooks/useNote";
import SelectNoteButton from "./SelectNoteButton";
import DeleteNoteButton from "./DeleteNoteButton";
import {
  addNotebookCollaboratorAction,
  assignNoteToNotebookAction,
  createNotebookAction,
  deleteNotebookAction,
  removeNoteFromNotebookAction,
  updateNotebookAction,
} from "@/actions/notebooks";
import { NotebookTreeNode } from "./AppSidebar";
import { toast } from "sonner";
import { Note, NoteNotebook } from "@prisma/client";
import { cn } from "@/lib/utils";

type NoteWithNotebooks = Note & { notebooks: NoteNotebook[] };

type Props = {
  notes: NoteWithNotebooks[];
  notebooks: NotebookTreeNode[];
  currentUserId: string;
  defaultNotebookId: string | null;
};

type NotebookDialogState =
  | { type: "create"; parentId?: string | null }
  | { type: "rename"; notebookId: string; currentName: string }
  | { type: "share"; notebookId: string; name: string }
  | { type: "delete"; notebookId: string; name: string }
  | null;

function SidebarGroupContent({ notes, notebooks, defaultNotebookId }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const noteIdParam = searchParams.get("noteId") || "";

  const [searchText, setSearchText] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [dialogState, setDialogState] = useState<NotebookDialogState>(null);
  const [pending, startTransition] = useTransition();
  const [emailInput, setEmailInput] = useState("");
  const [notebookNameInput, setNotebookNameInput] = useState("");

  const { noteText, noteTitle, noteTags } = useNote();

  const [localNotes, setLocalNotes] = useState<NoteWithNotebooks[]>(notes);

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
        const updated: NoteWithNotebooks = {
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

  const filteredNoteIds = useMemo(() => new Set(filteredNotes.map((note) => note.id)), [filteredNotes]);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    localNotes.forEach((note) => {
      note.tags?.forEach((tag) => set.add(tag));
    });
    return Array.from(set).sort();
  }, [localNotes]);

  const toggleExpansion = (id: string) => {
    setExpanded((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleCreateNotebook = (parentId?: string | null) => {
    setNotebookNameInput("");
    setDialogState({ type: "create", parentId: parentId ?? null });
  };

  const handleRenameNotebook = (notebookId: string, currentName: string) => {
    setNotebookNameInput(currentName);
    setDialogState({ type: "rename", notebookId, currentName });
  };

  const handleShareNotebook = (notebookId: string, name: string) => {
    setEmailInput("");
    setDialogState({ type: "share", notebookId, name });
  };

  const handleDeleteNotebook = (notebookId: string, name: string) => {
    setDialogState({ type: "delete", notebookId, name });
  };

  const submitDialog = () => {
    if (!dialogState) return;
    if (dialogState.type === "create") {
      const name = notebookNameInput.trim();
      if (!name) return;
      startTransition(async () => {
        const result = await createNotebookAction({
          name,
          parentId: dialogState.parentId ?? undefined,
        });
        if (result?.errorMessage) {
          toast.error(result.errorMessage);
        } else {
          toast.success("Notebook created");
          router.refresh();
        }
        setDialogState(null);
      });
    } else if (dialogState.type === "rename") {
      const name = notebookNameInput.trim();
      if (!name) return;
      startTransition(async () => {
        const result = await updateNotebookAction(dialogState.notebookId, { name });
        if (result?.errorMessage) {
          toast.error(result.errorMessage);
        } else {
          toast.success("Notebook renamed");
          router.refresh();
        }
        setDialogState(null);
      });
    } else if (dialogState.type === "share") {
      const email = emailInput.trim();
      if (!email) return;
      startTransition(async () => {
        const result = await addNotebookCollaboratorAction(dialogState.notebookId, email, "editor");
        if (result?.errorMessage) {
          toast.error(result.errorMessage);
        } else {
          toast.success("Notebook shared");
          router.refresh();
        }
        setDialogState(null);
      });
    } else if (dialogState.type === "delete") {
      startTransition(async () => {
        const result = await deleteNotebookAction(dialogState.notebookId);
        if (result?.errorMessage) {
          toast.error(result.errorMessage);
        } else {
          toast.success("Notebook deleted");
          router.refresh();
        }
        setDialogState(null);
      });
    }
  };

  const cancelDialog = () => {
    setDialogState(null);
  };

  const filteredNotebooks = useMemo(() => {
    const filterTree = (node: NotebookTreeNode): NotebookTreeNode | null => {
      const filteredNotesForNode = node.notes.filter((note) => filteredNoteIds.has(note.id));
      const filteredChildren = node.children
        .map((child) => filterTree(child))
        .filter((child): child is NotebookTreeNode => child !== null);

      if (filteredNotesForNode.length === 0 && filteredChildren.length === 0) {
        return null;
      }

      return {
        ...node,
        notes: filteredNotesForNode,
        children: filteredChildren,
      };
    };

    return notebooks
      .map((node) => filterTree(node))
      .filter((node): node is NotebookTreeNode => node !== null);
  }, [notebooks, filteredNoteIds]);

  const onAssignNote = (noteId: string, notebookId: string) => {
    startTransition(async () => {
      const result = await assignNoteToNotebookAction(noteId, notebookId);
      if (result?.errorMessage) {
        toast.error(result.errorMessage);
      } else {
        toast.success("Note moved");
        router.refresh();
      }
    });
  };

  const onRemoveNote = (noteId: string, notebookId: string) => {
    startTransition(async () => {
      const result = await removeNoteFromNotebookAction(noteId, notebookId);
      if (result?.errorMessage) {
        toast.error(result.errorMessage);
      } else {
        toast.success("Note removed from notebook");
        router.refresh();
      }
    });
  };

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

      <div className="flex items-center justify-between">
        <Button size="sm" variant="outline" onClick={() => handleCreateNotebook()}>
          <FolderPlus className="mr-2 h-4 w-4" />
          New Notebook
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() =>
            setExpanded((prev) => {
              const next: Record<string, boolean> = {};
              const expand = Object.values(prev).some((value) => !value);
              const walk = (nodes: NotebookTreeNode[]) => {
                nodes.forEach((node) => {
                  next[node.id] = expand;
                  if (node.children.length > 0) walk(node.children);
                });
              };
              walk(notebooks);
              return next;
            })
          }
          title="Toggle expand all"
        >
          <ChevronsDownUp className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-2 overflow-y-auto pb-4">
        {filteredNotebooks.map((node) => (
          <NotebookNode
            key={node.id}
            node={node}
            depth={0}
            isExpanded={(id) => expanded[id] ?? true}
            toggleExpansion={toggleExpansion}
            onAssignNote={onAssignNote}
            onRemoveNote={onRemoveNote}
            onCreateChild={handleCreateNotebook}
            onRename={handleRenameNotebook}
            onShare={handleShareNotebook}
            onDelete={handleDeleteNotebook}
            defaultNotebookId={defaultNotebookId}
          />
        ))}
        {filteredNotebooks.length === 0 && (
          <p className="text-sm text-muted-foreground">No notes match the current filters.</p>
        )}
      </div>

      <NotebookDialog
        state={dialogState}
        notebookNameInput={notebookNameInput}
        setNotebookNameInput={setNotebookNameInput}
        emailInput={emailInput}
        setEmailInput={setEmailInput}
        pending={pending}
        onSubmit={submitDialog}
        onCancel={cancelDialog}
      />
    </SidebarGroupContentCN>
  );
}

type NotebookNodeProps = {
  node: NotebookTreeNode;
  depth: number;
  isExpanded: (id: string) => boolean;
  toggleExpansion: (id: string) => void;
  onAssignNote: (noteId: string, notebookId: string) => void;
  onRemoveNote: (noteId: string, notebookId: string) => void;
  onCreateChild: (parentId?: string | null) => void;
  onRename: (notebookId: string, currentName: string) => void;
  onShare: (notebookId: string, name: string) => void;
  onDelete: (notebookId: string, name: string) => void;
  defaultNotebookId: string | null;
};

function NotebookNode({
  node,
  depth,
  isExpanded,
  toggleExpansion,
  onAssignNote,
  onRemoveNote,
  onCreateChild,
  onRename,
  onShare,
  onDelete,
  defaultNotebookId,
}: NotebookNodeProps) {
  const expanded = isExpanded(node.id);
  const isDefault = defaultNotebookId === node.id;
  const isSynthetic = node.id.startsWith("__");
  const isOwner = node.isOwner;
  const hasChildren = node.children.length > 0;
  const hasNotes = node.notes.length > 0;
  const canManage = isOwner && !isSynthetic;

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const noteId = event.dataTransfer.getData("application/note-id");
    if (!noteId) return;
    if (isSynthetic) return;
    onAssignNote(noteId, node.id);
  };

  const allowDrop = (event: React.DragEvent<HTMLDivElement>) => {
    if (!isSynthetic) {
      event.preventDefault();
    }
  };

  const spacing = depth * 12;

  return (
    <div className="space-y-1">
      <div
        className={cn(
          "group flex items-center justify-between rounded-md border border-transparent px-2 py-1 transition-colors",
          !isSynthetic && "hover:border-border"
        )}
        style={{ paddingLeft: spacing }}
        onDragOver={allowDrop}
        onDrop={handleDrop}
      >
        <div className="flex items-center gap-2">
          {hasChildren || hasNotes ? (
            <button
              type="button"
              onClick={() => toggleExpansion(node.id)}
              className="rounded p-0.5 text-muted-foreground hover:bg-muted"
            >
              {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
          ) : (
            <span className="w-4" />
          )}
          <div className="flex flex-col">
            <span className="font-medium text-sm">{node.name}</span>
            {node.description && <span className="text-xs text-muted-foreground">{node.description}</span>}
          </div>
        </div>

        {!isSynthetic && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost" className="h-6 w-6">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Notebook options</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => onCreateChild(node.id)}>
                <FolderPlus className="mr-2 h-4 w-4" />
                New sub-notebook
              </DropdownMenuItem>
              {canManage && (
                <DropdownMenuItem onClick={() => onRename(node.id, node.name)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Rename
                </DropdownMenuItem>
              )}
              {isOwner && (
                <DropdownMenuItem onClick={() => onShare(node.id, node.name)}>
                  <Share2 className="mr-2 h-4 w-4" />
                  Share…
                </DropdownMenuItem>
              )}
              {!isDefault && !isSynthetic && canManage && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => onDelete(node.id, node.name)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {expanded && (
        <div className="space-y-1" style={{ marginLeft: spacing + 12 }}>
          {node.notes.map((note) => (
            <NoteListItem
              key={note.id}
              note={note}
              notebookId={node.id}
              syntheticNotebook={isSynthetic}
              onRemoveNote={onRemoveNote}
            />
          ))}
          {node.children.map((child) => (
            <NotebookNode
              key={child.id}
              node={child}
              depth={depth + 1}
              isExpanded={isExpanded}
              toggleExpansion={toggleExpansion}
              onAssignNote={onAssignNote}
              onRemoveNote={onRemoveNote}
              onCreateChild={onCreateChild}
              onRename={onRename}
              onShare={onShare}
              onDelete={onDelete}
              currentUserId={currentUserId}
              defaultNotebookId={defaultNotebookId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

type NoteListItemProps = {
  note: NoteWithNotebooks;
  notebookId: string;
  syntheticNotebook: boolean;
  onRemoveNote: (noteId: string, notebookId: string) => void;
};

function NoteListItem({ note, notebookId, syntheticNotebook, onRemoveNote }: NoteListItemProps) {
  const handleDragStart = (event: React.DragEvent<HTMLDivElement>) => {
    event.dataTransfer.setData("application/note-id", note.id);
    event.dataTransfer.effectAllowed = "move";
  };

  return (
    <div
      className="group flex items-center justify-between rounded-md border border-transparent px-2 py-1 hover:border-border"
      draggable
      onDragStart={handleDragStart}
    >
      <SelectNoteButton note={note} />
      <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        {!syntheticNotebook && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-destructive"
            onClick={() => onRemoveNote(note.id, notebookId)}
            title="Remove from notebook"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
        <DeleteNoteButton noteId={note.id} />
      </div>
    </div>
  );
}

type NotebookDialogProps = {
  state: NotebookDialogState;
  notebookNameInput: string;
  setNotebookNameInput: (value: string) => void;
  emailInput: string;
  setEmailInput: (value: string) => void;
  pending: boolean;
  onSubmit: () => void;
  onCancel: () => void;
};

function NotebookDialog({
  state,
  notebookNameInput,
  setNotebookNameInput,
  emailInput,
  setEmailInput,
  pending,
  onSubmit,
  onCancel,
}: NotebookDialogProps) {
  if (!state) return null;

  let title = "";
  let description = "";
  let inputLabel = "";
  let inputValue = "";
  let setInputValue: (val: string) => void = () => {};
  let showInput = true;

  switch (state.type) {
    case "create":
      title = state.parentId ? "New sub-notebook" : "New notebook";
      description = state.parentId ? "Create a notebook inside the selected parent." : "Create a notebook.";
      inputLabel = "Notebook name";
      inputValue = notebookNameInput;
      setInputValue = setNotebookNameInput;
      break;
    case "rename":
      title = "Rename notebook";
      description = "Update the notebook name.";
      inputLabel = "Notebook name";
      inputValue = notebookNameInput;
      setInputValue = setNotebookNameInput;
      break;
    case "share":
      title = `Share “${state.name}”`;
      description = "Invite someone to collaborate on this notebook.";
      inputLabel = "Collaborator email";
      inputValue = emailInput;
      setInputValue = setEmailInput;
      break;
    case "delete":
      title = `Delete “${state.name}”?`;
      description = "Notes will move to your default notebook.";
      showInput = false;
      break;
  }

  return (
    <Dialog open onOpenChange={onCancel}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <p className="text-sm text-muted-foreground">{description}</p>
        </DialogHeader>
        {showInput && (
          <div className="space-y-2">
            <label className="text-sm font-medium">{inputLabel}</label>
            <Input
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              autoFocus
            />
          </div>
        )}
        <DialogFooter>
          <Button variant="ghost" onClick={onCancel} disabled={pending}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={pending}>
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default SidebarGroupContent;