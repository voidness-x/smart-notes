import DOMPurify from "dompurify";
import { JSDOM } from "jsdom";
import { prisma } from "@/db/prisma";

let serverPurify: ReturnType<typeof DOMPurify> | null = null;

function getDOMPurify() {
  if (typeof window === "undefined") {
    if (!serverPurify) {
      const dom = new JSDOM("<!DOCTYPE html>", {
        url: "http://localhost",
        referrer: "http://localhost",
        contentType: "text/html",
      });
      serverPurify = DOMPurify(dom.window as unknown as Window);
    }
    return serverPurify;
  }
  return DOMPurify;
}

export function sanitizeHTML(dirty: string): string {
  if (!dirty) return "";
  try {
    return getDOMPurify().sanitize(dirty, {
      ALLOWED_TAGS: ["p", "br", "strong", "em", "u", "s", "h1", "h2", "h3", "h4", "h5", "h6", "ul", "ol", "li", "a", "code", "pre"],
      ALLOWED_ATTR: ["href", "title"],
      ALLOW_DATA_ATTR: false,
      FORBID_TAGS: ["script", "iframe", "object", "embed", "form", "input", "button"],
      FORBID_ATTR: ["onerror", "onload", "onclick", "onmouseover", "style"],
    });
  } catch {
    return dirty.replace(/<[^>]*>/g, "");
  }
}

export function isValidUUID(uuid: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uuid);
}

export async function canAccessNote(noteId: string, userId: string): Promise<boolean> {
  try {
    const note = await prisma.note.findUnique({
      where: { id: noteId },
      select: { authorId: true, collaborators: { select: { id: true } } },
    });
    return note ? (note.authorId === userId || note.collaborators.some((c: { id: string }) => c.id === userId)) : false;
  } catch {
    return false;
  }
}

export async function isNoteAuthor(noteId: string, userId: string): Promise<boolean> {
  try {
    const note = await prisma.note.findUnique({ where: { id: noteId }, select: { authorId: true } });
    return note?.authorId === userId;
  } catch {
    return false;
  }
}

