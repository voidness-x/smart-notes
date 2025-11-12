import { getUser } from "@/auth/server";
import { prisma } from "@/db/prisma";
import { canAccessNote, isNoteAuthor } from "./security";
import { validateInput, noteIdSchema } from "./validation";
import { z } from "zod";

export async function requireAuth() {
  const user = await getUser();
  if (!user) throw new Error("You must be logged in");
  return user;
}

export async function validateNoteAccess(noteId: string, requireAuthor = false) {
  const user = await requireAuth();
  const validated = validateInput(noteIdSchema, noteId);
  if (!validated.success) throw new Error(validated.error);
  
  const hasAccess = requireAuthor
    ? await isNoteAuthor(validated.data, user.id)
    : await canAccessNote(validated.data, user.id);
  
  if (!hasAccess) throw new Error("You don't have permission");
  return { user, noteId: validated.data };
}

export function validate<T>(schema: z.ZodSchema<T>, input: unknown): T {
  const result = validateInput(schema, input);
  if (!result.success) throw new Error(result.error);
  return result.data;
}

export async function requireRole(allowedRoles: string[]) {
  const user = await requireAuth();
  const userData = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true },
  });
  if (!userData || !allowedRoles.includes(userData.role)) throw new Error("Unauthorized");
  return user;
}

export function serializeDates<T extends Record<string, any>>(obj: T): T {
  const serialized = { ...obj };
  if (serialized.createdAt instanceof Date) serialized.createdAt = serialized.createdAt.toISOString() as any;
  if (serialized.updatedAt instanceof Date) serialized.updatedAt = serialized.updatedAt.toISOString() as any;
  return serialized;
}

export function serializeDatesArray<T extends Record<string, any>>(arr: T[]): T[] {
  return arr.map(serializeDates);
}
