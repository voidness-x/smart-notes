"use server"

import { prisma } from "@/db/prisma";
import { requireAuth, validateNoteAccess } from "@/lib/helpers";
import { handleError } from "@/lib/utils";
import { z } from "zod";

const notebookIdSchema = z.string().uuid();
const notebookNameSchema = z.string().min(1).max(120);
const notebookDescriptionSchema = z.string().max(500).optional();
const notebookColorSchema = z
  .string()
  .regex(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i, "Invalid hex color")
  .optional();

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "notebook";
}

async function getAccessibleNotebook(notebookId: string, userId: string) {
  return prisma.notebook.findFirst({
    where: {
      id: notebookId,
      OR: [
        { authorId: userId },
        {
          collaborators: {
            some: {
              userId,
            },
          },
        },
      ],
    },
  });
}

export async function ensureDefaultNotebook(userId: string) {
  const slug = "default";
  const defaultName = "My Notes";

  let notebook = await prisma.notebook.findFirst({
    where: { authorId: userId, slug },
  });

  if (!notebook) {
    notebook = await prisma.notebook.create({
      data: {
        name: defaultName,
        slug,
        authorId: userId,
        orderIndex: 0,
      },
    });
  }

  const unassignedNotes = await prisma.note.findMany({
    where: {
      authorId: userId,
      notebooks: { none: {} },
    },
    select: { id: true },
  });

  if (unassignedNotes.length > 0) {
    await prisma.noteNotebook.createMany({
      data: unassignedNotes.map((note, index) => ({
        notebookId: notebook!.id,
        noteId: note.id,
        position: index,
      })),
      skipDuplicates: true,
    });
  }

  return notebook;
}

export async function createNotebookAction(payload: {
  name: string;
  parentId?: string | null;
  color?: string | null;
  description?: string | null;
}) {
  try {
    const user = await requireAuth();
    const name = notebookNameSchema.parse(payload.name);
    const parentId = payload.parentId ? notebookIdSchema.parse(payload.parentId) : undefined;
    const color = payload.color ? notebookColorSchema.parse(payload.color) : undefined;
    const description = payload.description ? notebookDescriptionSchema.parse(payload.description) : undefined;

    if (parentId) {
      const parent = await getAccessibleNotebook(parentId, user.id);
      if (!parent) throw new Error("Parent notebook not found or inaccessible");
    }

    const siblingCount = await prisma.notebook.count({
      where: {
        authorId: user.id,
        parentId: parentId ?? null,
      },
    });

    const notebook = await prisma.notebook.create({
      data: {
        name,
        slug: slugify(name),
        description: description ?? undefined,
        color,
        authorId: user.id,
        parentId: parentId ?? null,
        orderIndex: siblingCount,
      },
    });

    return { errorMessage: null, notebook };
  } catch (error) {
    return handleError(error);
  }
}

export async function updateNotebookAction(
  notebookId: string,
  payload: { name?: string; color?: string | null; description?: string | null }
) {
  try {
    const user = await requireAuth();
    const id = notebookIdSchema.parse(notebookId);
    const notebook = await getAccessibleNotebook(id, user.id);
    if (!notebook) throw new Error("Notebook not found");
    if (notebook.slug === "default" && payload.name && payload.name.trim() === "") {
      throw new Error("Default notebook must have a name");
    }

    const data: {
      name?: string;
      slug?: string;
      color?: string | null;
      description?: string | null;
    } = {};
    if (payload.name) {
      const name = notebookNameSchema.parse(payload.name);
      data.name = name;
      data.slug = notebook.authorId === user.id ? slugify(name) : notebook.slug;
    }
    if (payload.color !== undefined) {
      data.color = payload.color ? notebookColorSchema.parse(payload.color) : null;
    }
    if (payload.description !== undefined) {
      data.description = payload.description ? notebookDescriptionSchema.parse(payload.description) : null;
    }

    const updated = await prisma.notebook.update({
      where: { id },
      data,
    });

    return { errorMessage: null, notebook: updated };
  } catch (error) {
    return handleError(error);
  }
}

export async function moveNotebookAction(
  notebookId: string,
  payload: { parentId?: string | null; orderIndex?: number }
) {
  try {
    const user = await requireAuth();
    const id = notebookIdSchema.parse(notebookId);
    const notebook = await getAccessibleNotebook(id, user.id);
    if (!notebook) throw new Error("Notebook not found");
    if (notebook.slug === "default") throw new Error("Cannot move default notebook");

    const parentId = payload.parentId ? notebookIdSchema.parse(payload.parentId) : null;
    if (parentId) {
      const parent = await getAccessibleNotebook(parentId, user.id);
      if (!parent) throw new Error("Parent notebook not found");
      if (parent.id === notebook.id) throw new Error("Cannot set notebook as its own parent");
    }

    const siblingsCount = await prisma.notebook.count({
      where: {
        authorId: notebook.authorId,
        parentId,
        NOT: { id },
      },
    });

    const orderIndex =
      typeof payload.orderIndex === "number" && payload.orderIndex >= 0
        ? Math.min(payload.orderIndex, siblingsCount)
        : siblingsCount;

    await prisma.$transaction([
      prisma.notebook.updateMany({
        where: {
          authorId: notebook.authorId,
          parentId,
          NOT: { id },
          orderIndex: { gte: orderIndex },
        },
        data: { orderIndex: { increment: 1 } },
      }),
      prisma.notebook.update({
        where: { id },
        data: {
          parentId,
          orderIndex,
        },
      }),
    ]);

    return { errorMessage: null };
  } catch (error) {
    return handleError(error);
  }
}

export async function deleteNotebookAction(notebookId: string, options?: { moveNotesTo?: string | null }) {
  try {
    const user = await requireAuth();
    const id = notebookIdSchema.parse(notebookId);
    const notebook = await getAccessibleNotebook(id, user.id);
    if (!notebook) throw new Error("Notebook not found");
    if (notebook.slug === "default") throw new Error("Cannot delete default notebook");

    const targetNotebookId = options?.moveNotesTo ? notebookIdSchema.parse(options.moveNotesTo) : undefined;
    let targetNotebook = null;

    if (targetNotebookId) {
      targetNotebook = await getAccessibleNotebook(targetNotebookId, user.id);
      if (!targetNotebook) throw new Error("Target notebook not found");
    } else {
      targetNotebook = await ensureDefaultNotebook(notebook.authorId);
    }

    await prisma.$transaction([
      prisma.noteNotebook.updateMany({
        where: { notebookId: id },
        data: {
          notebookId: targetNotebook!.id,
        },
      }),
      prisma.notebook.delete({
        where: { id },
      }),
    ]);

    return { errorMessage: null };
  } catch (error) {
    return handleError(error);
  }
}

export async function assignNoteToNotebookAction(noteId: string, notebookId: string) {
  try {
    const user = await requireAuth();
    const noteAccess = await validateNoteAccess(noteId);
    if (noteAccess.user.id !== user.id && notebookId) {
      // validateNoteAccess already ensures user has rights (author or collaborator)
    }
    const notebook = await getAccessibleNotebook(notebookId, user.id);
    if (!notebook) throw new Error("Notebook not found");

    await prisma.$transaction([
      prisma.noteNotebook.deleteMany({
        where: { noteId },
      }),
      prisma.noteNotebook.create({
        data: {
          noteId,
          notebookId,
        },
      }),
    ]);

    return { errorMessage: null };
  } catch (error) {
    return handleError(error);
  }
}

export async function removeNoteFromNotebookAction(noteId: string, notebookId: string) {
  try {
    const user = await requireAuth();
    await validateNoteAccess(noteId);
    const notebook = await getAccessibleNotebook(notebookId, user.id);
    if (!notebook) throw new Error("Notebook not found");
    if (notebook.slug === "default") throw new Error("Cannot remove note from default notebook");

    const deleted = await prisma.noteNotebook.deleteMany({
      where: { noteId, notebookId },
    });

    if (deleted.count === 0) {
      throw new Error("Note is not assigned to this notebook");
    }

    const defaultNotebook = await ensureDefaultNotebook(notebook.authorId);
    await prisma.noteNotebook.create({
      data: {
        noteId,
        notebookId: defaultNotebook.id,
      },
    });

    return { errorMessage: null };
  } catch (error) {
    return handleError(error);
  }
}

export async function addNotebookCollaboratorAction(
  notebookId: string,
  email: string,
  role: "editor" | "viewer" = "editor"
) {
  try {
    const user = await requireAuth();
    const id = notebookIdSchema.parse(notebookId);
    const notebook = await getAccessibleNotebook(id, user.id);
    if (!notebook) throw new Error("Notebook not found");
    if (notebook.authorId !== user.id) throw new Error("Only owner can share notebook");

    const targetUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (!targetUser) throw new Error("User not found");
    if (targetUser.id === user.id) throw new Error("Owner already has access");

    await prisma.notebookCollaborator.upsert({
      where: {
        notebookId_userId: {
          notebookId: id,
          userId: targetUser.id,
        },
      },
      create: {
        notebookId: id,
        userId: targetUser.id,
        role,
      },
      update: {
        role,
      },
    });

    return { errorMessage: null };
  } catch (error) {
    return handleError(error);
  }
}

export async function removeNotebookCollaboratorAction(notebookId: string, userId: string) {
  try {
    const user = await requireAuth();
    const id = notebookIdSchema.parse(notebookId);
    const targetUserId = z.string().uuid().parse(userId);

    const notebook = await getAccessibleNotebook(id, user.id);
    if (!notebook) throw new Error("Notebook not found");
    if (notebook.authorId !== user.id) throw new Error("Only owner can remove collaborators");

    await prisma.notebookCollaborator.deleteMany({
      where: { notebookId: id, userId: targetUserId },
    });

    return { errorMessage: null };
  } catch (error) {
    return handleError(error);
  }
}

export async function reorderNotebookNotesAction(
  notebookId: string,
  noteOrder: { noteId: string; position: number }[]
) {
  try {
    const user = await requireAuth();
    const id = notebookIdSchema.parse(notebookId);
    const notebook = await getAccessibleNotebook(id, user.id);
    if (!notebook) throw new Error("Notebook not found");

    const updates = noteOrder.map(({ noteId, position }) =>
      prisma.noteNotebook.update({
        where: {
          noteId_notebookId: {
            noteId,
            notebookId: id,
          },
        },
        data: { position },
      })
    );

    await prisma.$transaction(updates);

    return { errorMessage: null };
  } catch (error) {
    return handleError(error);
  }
}

export async function getUserNotebooks(userId: string) {
  const notebooks = await prisma.notebook.findMany({
    where: {
      OR: [
        { authorId: userId },
        {
          collaborators: {
            some: {
              userId,
            },
          },
        },
      ],
    },
    include: {
      notes: {
        include: {
          note: true,
        },
        orderBy: {
          position: "asc",
        },
      },
      collaborators: true,
    },
    orderBy: [
      { parentId: "asc" },
      { orderIndex: "asc" },
      { name: "asc" },
    ],
  });

  return notebooks;
}

