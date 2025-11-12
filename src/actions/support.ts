"use server";

import { handleError } from "@/lib/utils";
import { prisma } from "@/db/prisma";
import { emailSchema, supportTitleSchema, supportDescriptionSchema } from "@/lib/validation";
import { requireAuth, validate, requireRole } from "@/lib/helpers";

export const createSupportTicketAction = async (
  email: string,
  title: string,
  description: string,
  photoUrl?: string
) => {
  try {
    const user = await requireAuth();
    const validEmail = validate(emailSchema, email);
    const validTitle = validate(supportTitleSchema, title);
    const validDescription = validate(supportDescriptionSchema, description);

    if (photoUrl && (photoUrl.length > 5000000 || !photoUrl.startsWith("data:image/"))) {
      return { errorMessage: "Invalid image", success: false };
    }

    const ticket = await prisma.supportTicket.create({
      data: {
        userId: user.id,
        email: validEmail,
        title: validTitle,
        description: validDescription,
        photoUrl: photoUrl?.substring(0, 5000000) || null,
        status: "sent",
      },
    });

    return { errorMessage: null, success: true, ticket };
  } catch (error) {
    return handleError(error);
  }
};

const userSelect = { id: true, name: true, email: true };

export const getMySupportTicketsAction = async () => {
  try {
    const user = await requireAuth();
    const tickets = await prisma.supportTicket.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: { handledBy: { select: userSelect } },
    });
    return { errorMessage: null, tickets };
  } catch (error) {
    return { ...handleError(error), tickets: [] };
  }
};

export const getAllSupportTicketsAction = async () => {
  try {
    await requireRole(["admin", "supervisor"]);
    const tickets = await prisma.supportTicket.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: userSelect },
        handledBy: { select: userSelect },
      },
    });
    return { errorMessage: null, tickets };
  } catch (error) {
    return { ...handleError(error), tickets: [] };
  }
};

export const assignTicketAction = async (ticketId: string) => {
  try {
    const user = await requireRole(["admin", "supervisor"]);
    const ticket = await prisma.supportTicket.update({
      where: { id: ticketId },
      data: { handledById: user.id, handledAt: new Date(), status: "being_processed" },
    });
    return { errorMessage: null, success: true, ticket };
  } catch (error) {
    return { ...handleError(error), success: false };
  }
};

export const updateTicketStatusAction = async (
  ticketId: string,
  status: "sent" | "being_processed" | "complete",
  solution?: string
) => {
  try {
    const user = await requireRole(["admin", "supervisor"]);
    const existingTicket = await prisma.supportTicket.findUnique({
      where: { id: ticketId },
      select: { handledById: true },
    });

    const ticket = await prisma.supportTicket.update({
      where: { id: ticketId },
      data: {
        status,
        ...(solution !== undefined && { solution }),
        ...(status === "complete" && !existingTicket?.handledById && {
          handledById: user.id,
          handledAt: new Date(),
        }),
      },
      include: { handledBy: { select: userSelect } },
    });

    return { errorMessage: null, success: true, ticket };
  } catch (error) {
    return { ...handleError(error), success: false };
  }
};

export const submitTicketSatisfactionAction = async (ticketId: string, satisfied: boolean) => {
  try {
    const user = await requireAuth();
    const ticket = await prisma.supportTicket.findUnique({
      where: { id: ticketId },
      select: { userId: true, status: true },
    });

    if (!ticket || ticket.userId !== user.id || ticket.status !== "complete") {
      return { errorMessage: "Invalid ticket", success: false };
    }

    await prisma.supportTicket.update({ where: { id: ticketId }, data: { satisfied } });
    return { errorMessage: null, success: true };
  } catch (error) {
    return { ...handleError(error), success: false };
  }
};

export const getTicketStatsAction = async () => {
  try {
    await requireRole(["admin", "supervisor"]);
    const stats = await prisma.supportTicket.groupBy({
      by: ["handledById"],
      where: { status: "complete", handledById: { not: null } },
      _count: { id: true },
    });

    const statsWithUsers = await Promise.all(
      stats
        .filter(stat => stat.handledById)
        .map(async (stat) => ({
          handler: await prisma.user.findUnique({
            where: { id: stat.handledById! },
            select: userSelect,
          }),
          count: stat._count.id,
        }))
    );

    return { errorMessage: null, stats: statsWithUsers };
  } catch (error) {
    return { ...handleError(error), stats: [] };
  }
};

