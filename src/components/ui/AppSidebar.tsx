import { getUser } from "@/auth/server";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
} from "@/components/ui/sidebar";
import { prisma } from "@/db/prisma";
import { Note, NoteNotebook, NotebookCollaborator } from "@prisma/client";
import Link from "next/link";
import SidebarGroupContent from "./SidebarGroupContent";
import ReviewButton from "./ReviewButton";
import SupportButton from "./SupportButton";
import { ensureDefaultNotebook, getUserNotebooks } from "@/actions/notebooks";

export type NotebookTreeNode = {
  id: string;
  name: string;
  slug?: string;
  parentId: string | null;
  color?: string | null;
  description?: string | null;
  orderIndex: number;
  isOwner: boolean;
  collaborators: NotebookCollaborator[];
  notes: (Note & { notebooks: NoteNotebook[] })[];
  children: NotebookTreeNode[];
};

function buildNotebookTree(
  notebooks: Awaited<ReturnType<typeof getUserNotebooks>>,
  notes: (Note & { notebooks: NoteNotebook[] })[],
  currentUserId: string
) {
  const nodeMap = new Map<string, NotebookTreeNode>();

  notebooks.forEach((notebook) => {
    nodeMap.set(notebook.id, {
      id: notebook.id,
      name: notebook.name,
      slug: notebook.slug,
      parentId: notebook.parentId,
      color: notebook.color ?? undefined,
      description: notebook.description ?? undefined,
      orderIndex: notebook.orderIndex,
      isOwner: notebook.authorId === currentUserId,
      collaborators: notebook.collaborators,
      notes: [],
      children: [],
    });
  });

  const unassigned: (Note & { notebooks: NoteNotebook[] })[] = [];

  notes.forEach((note) => {
    const notebookIds = note.notebooks.map((nn) => nn.notebookId).filter((id) => nodeMap.has(id));
    if (notebookIds.length === 0) {
      unassigned.push(note);
    } else {
      notebookIds.forEach((id) => {
        const node = nodeMap.get(id);
        if (!node) return;
        node.notes.push(note);
      });
    }
  });

  const roots: NotebookTreeNode[] = [];
  nodeMap.forEach((node) => {
    const parent = node.parentId ? nodeMap.get(node.parentId) : null;
    if (parent) {
      parent.children.push(node);
      parent.children.sort((a, b) => a.orderIndex - b.orderIndex || a.name.localeCompare(b.name));
    } else {
      roots.push(node);
    }
  });

  if (unassigned.length > 0) {
    roots.push({
      id: "__unassigned",
      name: "Uncategorized",
      parentId: null,
      orderIndex: Number.MAX_SAFE_INTEGER,
      isOwner: true,
      collaborators: [],
      notes: unassigned,
      color: undefined,
      description: undefined,
      slug: "__unassigned",
      children: [],
    });
  }

  return roots.sort((a, b) => a.orderIndex - b.orderIndex || a.name.localeCompare(b.name));
}

async function AppSidebar() {
  const user = await getUser();

  let notes: (Note & { notebooks: NoteNotebook[] })[] = [];
  let notebooksTree: NotebookTreeNode[] = [];
  let defaultNotebookId: string | null = null;

  if (user) {
    try {
      const defaultNotebook = await ensureDefaultNotebook(user.id);
      defaultNotebookId = defaultNotebook?.id ?? null;

      const accessibleNotebooks = await getUserNotebooks(user.id);

      notes = await prisma.note.findMany({
        where: {
          OR: [
            { authorId: user.id },
            { collaborators: { some: { id: user.id } } },
          ],
        },
        include: {
          notebooks: true,
        },
        orderBy: {
          updatedAt: "desc",
        },
      });

      notebooksTree = buildNotebookTree(accessibleNotebooks, notes, user.id);
    } catch (error) {
      console.error("AppSidebar: Database error loading notes:", error);
    }
  }

  return (
    <Sidebar className="border-r">
      <SidebarContent className="custom-scrollbar">
        <SidebarGroup>
          <SidebarGroupLabel className="mb-2 mt-2 text-lg">
            {user ? (
              "Your Notes"
            ) : (
              <p>
                <Link href="/login" className="underline">
                  Login
                </Link>{" "}
                to see your notes
              </p>
            )}
          </SidebarGroupLabel>
          {user && (
            <SidebarGroupContent
              notes={notes}
              notebooks={notebooksTree}
              currentUserId={user.id}
              defaultNotebookId={defaultNotebookId}
            />
          )}
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SupportButton />
        <ReviewButton />
      </SidebarFooter>
    </Sidebar>
  );
}

export default AppSidebar;