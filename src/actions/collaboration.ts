"use server";

import { prisma } from "@/db/prisma";
import { handleError } from "@/lib/utils";
import { randomBytes } from "crypto";
import { inviteTokenSchema } from "@/lib/validation";
import { isValidUUID } from "@/lib/security";
import { requireAuth, validateNoteAccess, validate } from "@/lib/helpers";

export const toggleCollaborationAction = async (noteId: string, isCollaborative: boolean) => {
  try {
    const { noteId: validId, user } = await validateNoteAccess(noteId);
    const note = await prisma.note.findUnique({ 
      where: { id: validId },
      include: { collaborators: { select: { id: true } } }
    });
    if (!note || note.authorId !== user.id) throw new Error("You can only toggle collaboration on your own notes");
    
    // If turning off collaboration, remove all collaborators
    if (!isCollaborative) {
      // Disconnect all collaborators if there are any
      const collaboratorIds = note.collaborators.map(c => c.id);
      const updateData: any = { isCollaborative: false };
      
      if (collaboratorIds.length > 0) {
        updateData.collaborators = {
          disconnect: collaboratorIds.map(id => ({ id }))
        };
      }
      
      await prisma.note.update({ 
        where: { id: validId }, 
        data: updateData
      });
    } else {
      // Just enable collaboration
      await prisma.note.update({ 
        where: { id: validId }, 
        data: { isCollaborative: true } 
      });
    }
    
    return { errorMessage: null };
  } catch (error) {
    return handleError(error);
  }
};

export const createInviteLinkAction = async (noteId: string) => {
  try {
    const { noteId: validId, user } = await validateNoteAccess(noteId);
    const note = await prisma.note.findUnique({ where: { id: validId } });
    if (!note || note.authorId !== user.id) throw new Error("You can only create invites for your own notes");

    const inviteToken = randomBytes(32).toString("hex");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.collaborationInvite.create({
      data: { noteId: validId, senderId: user.id, inviteToken, expiresAt, status: "pending" },
    });

    // Get base URL for invite link - never use localhost in production
    let baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    if (!baseUrl && process.env.VERCEL_URL) {
        baseUrl = `https://${process.env.VERCEL_URL}`;
    }
    if (!baseUrl) {
        // In production, always use production URL, never localhost
        baseUrl = process.env.NODE_ENV === 'production' 
            ? 'https://smart-notes-olive-alpha.vercel.app' 
            : 'http://localhost:3000';
    }
    return { errorMessage: null, inviteLink: `${baseUrl}/notes?invite=${inviteToken}` };
  } catch (error) {
    return handleError(error);
  }
};

export const sendInviteByUserIdAction = async (noteId: string, receiverId: string) => {
  try {
    const { noteId: validId, user } = await validateNoteAccess(noteId);
    if (!isValidUUID(receiverId)) throw new Error("Invalid receiver ID");
    if (receiverId === user.id) throw new Error("You cannot invite yourself");

    const note = await prisma.note.findUnique({ where: { id: validId } });
    if (!note || note.authorId !== user.id) throw new Error("You can only send invites for your own notes");

    const receiver = await prisma.user.findUnique({ where: { id: receiverId } });
    if (!receiver) throw new Error("User not found");

    const isCollaborator = await prisma.note.findFirst({
      where: { id: validId, collaborators: { some: { id: receiverId } } },
    });
    if (isCollaborator) throw new Error("User is already a collaborator");

    const existingInvite = await prisma.collaborationInvite.findFirst({
      where: { noteId: validId, receiverId, status: "pending" },
    });
    if (existingInvite) throw new Error("An invite has already been sent to this user");

    const inviteToken = randomBytes(32).toString("hex");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.collaborationInvite.create({
      data: { noteId: validId, senderId: user.id, receiverId, inviteToken, expiresAt, status: "pending" },
    });

    return { errorMessage: null };
  } catch (error) {
    return handleError(error);
  }
};

export const getPendingInvitesAction = async () => {
  try {
    const user = await requireAuth();
    const invites = await prisma.collaborationInvite.findMany({
      where: {
        receiverId: user.id,
        status: "pending",
        expiresAt: { gte: new Date() },
      },
      include: {
        note: { select: { id: true, title: true, text: true } },
        sender: { select: { id: true, email: true, name: true, avatarUrl: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return { errorMessage: null, invites };
  } catch (error) {
    return handleError(error);
  }
};

export const acceptInviteAction = async (inviteId: string) => {
  try {
    const user = await requireAuth();
    if (!isValidUUID(inviteId)) throw new Error("Invalid invite ID");

    const invite = await prisma.collaborationInvite.findUnique({
      where: { id: inviteId },
      include: { note: true },
    });

    if (!invite || invite.receiverId !== user.id || invite.status !== "pending" || invite.expiresAt < new Date()) {
      throw new Error("Invalid or expired invite");
    }

    await prisma.note.update({
      where: { id: invite.noteId },
      data: { isCollaborative: true, collaborators: { connect: { id: user.id } } },
    });

    await prisma.collaborationInvite.update({
      where: { id: inviteId },
      data: { status: "accepted" },
    });

    return { errorMessage: null };
  } catch (error) {
    return handleError(error);
  }
};

export const rejectInviteAction = async (inviteId: string) => {
  try {
    const user = await requireAuth();
    if (!isValidUUID(inviteId)) throw new Error("Invalid invite ID");

    const invite = await prisma.collaborationInvite.findUnique({ where: { id: inviteId } });
    if (!invite || invite.receiverId !== user.id || invite.status !== "pending") {
      throw new Error("Invalid invite");
    }

    await prisma.collaborationInvite.update({
      where: { id: inviteId },
      data: { status: "rejected" },
    });

    return { errorMessage: null };
  } catch (error) {
    return handleError(error);
  }
};

export const acceptInviteByTokenAction = async (inviteToken: string) => {
  try {
    const user = await requireAuth();
    const validToken = validate(inviteTokenSchema, inviteToken);

    const invite = await prisma.collaborationInvite.findUnique({
      where: { inviteToken: validToken },
      include: { note: true },
    });

    if (!invite || invite.status !== "pending" || invite.expiresAt < new Date() || invite.note.authorId === user.id) {
      throw new Error("Invalid or expired invite");
    }

    if (invite.receiverId && invite.receiverId !== user.id) {
      throw new Error("This invite is for a different user");
    }

    if (!invite.receiverId) {
      await prisma.collaborationInvite.update({
        where: { id: invite.id },
        data: { receiverId: user.id },
      });
    }

    await prisma.note.update({
      where: { id: invite.noteId },
      data: { isCollaborative: true, collaborators: { connect: { id: user.id } } },
    });

    await prisma.collaborationInvite.update({
      where: { id: invite.id },
      data: { status: "accepted" },
    });

    return { errorMessage: null, noteId: invite.noteId };
  } catch (error) {
    return { ...handleError(error), noteId: undefined };
  }
};

