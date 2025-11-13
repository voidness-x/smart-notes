import DOMPurify from "dompurify";
import { prisma } from "@/db/prisma";

let serverPurify: ReturnType<typeof DOMPurify> | null = null;
let jsdomInitialized = false;
let jsdomInitError: Error | null = null;

// Simple server-side HTML sanitizer (fallback when jsdom fails)
function createFallbackSanitizer(): ReturnType<typeof DOMPurify> {
  return {
    sanitize: (dirty: string, options?: any) => {
      if (!dirty) return "";
      let cleaned = dirty;
      // Remove dangerous tags
      cleaned = cleaned.replace(/<script[^>]*>.*?<\/script>/gi, "");
      cleaned = cleaned.replace(/<iframe[^>]*>.*?<\/iframe>/gi, "");
      cleaned = cleaned.replace(/<object[^>]*>.*?<\/object>/gi, "");
      cleaned = cleaned.replace(/<embed[^>]*>/gi, "");
      // Remove event handlers
      cleaned = cleaned.replace(/on\w+="[^"]*"/gi, "");
      cleaned = cleaned.replace(/on\w+='[^']*'/gi, "");
      // Remove style attributes
      cleaned = cleaned.replace(/style="[^"]*"/gi, "");
      cleaned = cleaned.replace(/style='[^']*'/gi, "");
      return cleaned;
    },
  } as ReturnType<typeof DOMPurify>;
}

// Initialize JSDOM lazily with dynamic import to avoid ES Module issues
async function initializeJSDOM() {
  if (jsdomInitialized) {
    return;
  }
  
  try {
    // Use dynamic import to avoid ES Module issues in serverless environments
    const { JSDOM } = await import("jsdom");
    
    const dom = new JSDOM("<!DOCTYPE html>", {
      url: "http://localhost",
      referrer: "http://localhost",
      contentType: "text/html",
    });
    serverPurify = DOMPurify(dom.window as unknown as Window);
    jsdomInitialized = true;
  } catch (error: any) {
    console.error("Failed to initialize JSDOM for DOMPurify:", error?.message || error);
    jsdomInitError = error;
    // Use fallback sanitizer
    serverPurify = createFallbackSanitizer();
    jsdomInitialized = true;
  }
}

function getDOMPurify(): ReturnType<typeof DOMPurify> {
  if (typeof window === "undefined") {
    // Server-side: initialize JSDOM if not already done
    if (!jsdomInitialized) {
      // Start initialization (async, but we'll use fallback if not ready)
      initializeJSDOM().catch(() => {});
      // Return fallback sanitizer immediately
      return createFallbackSanitizer();
    }
    // Return initialized sanitizer (either DOMPurify or fallback)
    return serverPurify || createFallbackSanitizer();
  }
  // Client-side: use DOMPurify directly
  return DOMPurify;
}

export function sanitizeHTML(dirty: string): string {
  if (!dirty) return "";
  
  try {
    const purify = getDOMPurify();
    return purify.sanitize(dirty, {
      ALLOWED_TAGS: ["p", "br", "strong", "em", "u", "s", "h1", "h2", "h3", "h4", "h5", "h6", "ul", "ol", "li", "a", "code", "pre"],
      ALLOWED_ATTR: ["href", "title"],
      ALLOW_DATA_ATTR: false,
      FORBID_TAGS: ["script", "iframe", "object", "embed", "form", "input", "button"],
      FORBID_ATTR: ["onerror", "onload", "onclick", "onmouseover", "style"],
    });
  } catch (error) {
    console.error("Error sanitizing HTML:", error);
    // Fallback: basic tag stripping
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

