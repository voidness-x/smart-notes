"use server"

import { prisma } from "@/db/prisma";
import { handleError } from "@/lib/utils";
import { ChatCompletionMessageParam } from "openai/resources/index.mjs";
import openai from "@/openai";
import { sanitizeHTML } from "@/lib/security";
import { noteIdSchema, noteTextSchema, noteTitleSchema, noteTagsSchema, questionSchema } from "@/lib/validation";
import { requireAuth, validateNoteAccess, validate } from "@/lib/helpers";
import pdfParse from "pdf-parse";
import { v4 as uuidv4 } from "uuid";
import { htmlToPlainText } from "@/lib/utils";
import { PDFDocument as PdfLibDocument, StandardFonts } from "pdf-lib";

export const createNoteAction = async (noteId: string) => {
  try {
    const user = await requireAuth();
    validate(noteIdSchema, noteId);
    await prisma.note.create({
      data: { id: noteId, authorId: user.id, text: "", title: "No title" },
    });
    return { errorMessage: null };
  } catch (error) {
    return handleError(error);
  }
};

export const updateNoteAction = async (noteId: string, text: string) => {
  try {
    const { noteId: validId } = await validateNoteAccess(noteId);
    const validText = validate(noteTextSchema, text);
    await prisma.note.update({
      where: { id: validId },
      data: { text: validText },
    });
    return { errorMessage: null };
  } catch (error) {
    return handleError(error);
  }
};

export const deleteNoteAction = async (noteId: string) => {
  try {
    const { noteId: validId, user } = await validateNoteAccess(noteId, true);
    await prisma.note.delete({
      where: { id: validId, authorId: user.id },
    });
    return { errorMessage: null };
  } catch (error) {
    return handleError(error);
  }
};

export const togglePinAction = async (noteId: string) => {
  try {
    const { noteId: validId } = await validateNoteAccess(noteId);
    const note = await prisma.note.findUnique({ where: { id: validId } });
    if (!note) throw new Error("Note not found");
    await prisma.note.update({
      where: { id: validId },
      data: { pinned: !note.pinned },
    });
    return { errorMessage: null, success: true };
  } catch (error) {
    return { ...handleError(error), success: false };
  }
};

export const updateNoteTagsAction = async (noteId: string, tags: string[]) => {
  try {
    const { noteId: validId } = await validateNoteAccess(noteId);
    const validTags = validate(noteTagsSchema, tags);
    await prisma.note.update({
      where: { id: validId },
      data: { tags: validTags },
    });
    return { errorMessage: null };
  } catch (error) {
    return handleError(error);
  }
};

export const updateNoteTitleAction = async (noteId: string, title: string) => {
  try {
    const { noteId: validId } = await validateNoteAccess(noteId);
    const validTitle = validate(noteTitleSchema, title);
    await prisma.note.update({
      where: { id: validId },
      data: { title: validTitle },
    });
    return { errorMessage: null };
  } catch (error) {
    return handleError(error);
  }
};

export const importPdfNoteAction = async (formData: FormData) => {
  try {
    const user = await requireAuth();
    const file = formData.get("file");

    if (!file || typeof file !== "object" || !("arrayBuffer" in file)) {
      throw new Error("No PDF file provided");
    }

    const pdfFile = file as File;
    if (pdfFile.type && pdfFile.type !== "application/pdf") {
      throw new Error("Only PDF files are supported");
    }

    const arrayBuffer = await pdfFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const parsed = await pdfParse(buffer);
    const rawText = parsed.text?.trim();

    if (!rawText) {
      throw new Error("Could not extract text from PDF");
    }

    const paragraphs = rawText
      .split(/\n\s*\n/)
      .map((paragraph) => paragraph.trim())
      .filter(Boolean);

    const content =
      paragraphs.length > 0
        ? paragraphs.map((paragraph) => `<p>${sanitizeHTML(paragraph)}</p>`).join("")
        : "<p></p>";

    const derivedTitle =
      (pdfFile.name || "Imported PDF")
        .replace(/\.pdf$/i, "")
        .trim() || "Imported PDF";

    const noteId = uuidv4();
    await prisma.note.create({
      data: {
        id: noteId,
        authorId: user.id,
        title: derivedTitle,
        text: content,
      },
    });

    return { errorMessage: null, noteId };
  } catch (error) {
    return handleError(error);
  }
};

export const exportNoteAsPdfAction = async (noteId: string, title: string, htmlContent: string) => {
  try {
    await validateNoteAccess(noteId);

    const safeTitle = (() => {
      try {
        return validate(noteTitleSchema, title ?? "") || "Smart Notes Export";
      } catch {
        return "Smart Notes Export";
      }
    })();

    const safeContent = (() => {
      try {
        return validate(noteTextSchema, htmlContent ?? "");
      } catch {
        return "";
      }
    })();

    const plainText = htmlToPlainText(safeContent);
    if (!plainText) {
      throw new Error("Note is empty");
    }

    const pdfDoc = await PdfLibDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const fontSize = 12;
    const lineHeight = fontSize * 1.4;
    const margin = 50;

    const addPage = () => {
      const page = pdfDoc.addPage();
      const { width, height } = page.getSize();
      return { page, width, height };
    };

    let { page, width, height } = addPage();
    let y = height - margin;

    const drawLine = (line: string) => {
      if (y <= margin) {
        ({ page, width, height } = addPage());
        y = height - margin;
      }
      page.drawText(line, {
        x: margin,
        y,
        size: fontSize,
        font,
        maxWidth: width - margin * 2,
        lineHeight,
      });
      y -= lineHeight;
    };

    page.drawText(safeTitle, {
      x: margin,
      y,
      size: 18,
      font,
    });
    y -= lineHeight * 2;

    const paragraphs = plainText.split(/\n+/);
    for (const paragraph of paragraphs) {
      if (!paragraph.trim()) {
        y -= lineHeight;
        continue;
      }
      const words = paragraph.split(/\s+/);
      let currentLine = "";

      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const textWidth = font.widthOfTextAtSize(testLine, fontSize);
        if (textWidth <= width - margin * 2) {
          currentLine = testLine;
        } else {
          drawLine(currentLine);
          currentLine = word;
        }
      }

      if (currentLine) {
        drawLine(currentLine);
      }
      y -= lineHeight;
    }

    const pdfBytes = await pdfDoc.save();

    const safeFileName =
      (safeTitle || "note")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") || "note";

    return {
      errorMessage: null,
      pdfBase64: Buffer.from(pdfBytes).toString("base64"),
      fileName: `${safeFileName}.pdf`,
    };
  } catch (error) {
    return handleError(error);
  }
};

// New action to check if note has been updated (for polling-based real-time)
export const checkNoteUpdateAction = async (noteId: string, lastUpdatedAt: string) => {
  try {
    const { noteId: validId } = await validateNoteAccess(noteId);
    const note = await prisma.note.findUnique({
      where: { id: validId },
      select: {
        text: true,
        title: true,
        tags: true,
        updatedAt: true,
      },
    });

    if (!note) {
      return { errorMessage: "Note not found", hasUpdate: false };
    }

    // Check if note was updated after the last known update time
    const noteUpdatedAt = new Date(note.updatedAt).getTime();
    const lastKnownUpdate = new Date(lastUpdatedAt).getTime();
    const hasUpdate = noteUpdatedAt > lastKnownUpdate;

    if (hasUpdate) {
      return {
        errorMessage: null,
        hasUpdate: true,
        text: note.text,
        title: note.title || "No title",
        tags: note.tags || [],
        updatedAt: note.updatedAt.toISOString(),
      };
    }

    return { errorMessage: null, hasUpdate: false };
  } catch (error) {
    return { ...handleError(error), hasUpdate: false };
  }
};

export const askAIAboutNotesAction = async (
  newQuestions: string[],
  responses: string[],
) => {
  try {
    const user = await requireAuth();
    if (newQuestions.length > 10) throw new Error("Too many questions");

    newQuestions.forEach(q => validate(questionSchema, q));

    const notes = await prisma.note.findMany({
      where: { authorId: user.id },
      orderBy: { createdAt: "desc" },
      select: { text: true, createdAt: true, updatedAt: true },
      take: 100,
    });

    if (notes.length === 0) return "You don't have any notes yet.";

    const formattedNotes = notes
      .map((note, index) => {
        const date = new Date(note.createdAt).toLocaleDateString();
        const plainText = note.text.replace(/<[^>]*>/g, "").trim();
        return `Note ${index + 1} (Created: ${date}):\n${plainText}`;
      })
      .join("\n\n");

    const messages: ChatCompletionMessageParam[] = [
      {
        role: "system",
        content:
          "You are a helpful assistant that answers questions about the user's notes. The user will provide their notes and ask questions. Answer based on the notes provided. If the answer is not in the notes, say so.",
      },
      ...responses.map((r) => ({ role: "assistant" as const, content: r })),
      {
        role: "user",
        content: `Here are my notes:\n\n${formattedNotes}\n\nQuestions: ${newQuestions.join(", ")}`,
      },
    ];

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      temperature: 0.7,
    });

    return completion.choices[0]?.message?.content || "I couldn't generate a response.";
  } catch (error) {
    return handleError(error).errorMessage || "Failed to get AI response.";
  }
};
