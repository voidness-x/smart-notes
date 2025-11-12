"use server"

import { prisma } from "@/db/prisma";
import { handleError } from "@/lib/utils";
import { ChatCompletionMessageParam } from "openai/resources/index.mjs";
import openai from "@/openai";
import { sanitizeHTML } from "@/lib/security";
import { noteIdSchema, noteTextSchema, noteTitleSchema, noteTagsSchema, questionSchema } from "@/lib/validation";
import { requireAuth, validateNoteAccess, validate } from "@/lib/helpers";

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
      .map(note => `Text: ${note.text.substring(0, 5000)}\nCreated: ${note.createdAt}\nUpdated: ${note.updatedAt}`)
      .join("\n\n");

    const messages: ChatCompletionMessageParam[] = [{
      role: "system",
      content: `You are a helpful assistant that answers questions about a user's notes. 
Keep answers succinct. Format responses in clean HTML using <p>, <strong>, <em>, <ul>, <ol>, <li>, <h1>-<h6>, <br>.
Do NOT use inline styles, JavaScript, or dangerous content.

User's notes:
${formattedNotes}`,
    }];

    newQuestions.forEach((q, i) => {
      messages.push({ role: "user", content: q.substring(0, 1000) });
      if (responses[i]) messages.push({ role: "assistant", content: responses[i] });
    });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      max_tokens: 1000,
      temperature: 0.7,
    });

    return sanitizeHTML(completion.choices[0].message.content || "An error occurred");
  } catch (error: any) {
    console.error("AI error:", error);
    
    // Check for specific error types
    if (error?.status === 401 || error?.message?.includes("api key") || error?.message?.includes("API key")) {
      return "Error: OpenAI API key is missing or invalid. Please check your API configuration.";
    }
    
    if (error?.status === 429 || error?.message?.includes("rate limit") || error?.message?.includes("Rate limit")) {
      return "Error: Rate limit exceeded. Please wait a moment and try again.";
    }
    
    if (error?.status === 402 || error?.message?.includes("insufficient_quota") || error?.message?.includes("quota") || error?.message?.includes("credits")) {
      return "Error: Insufficient API credits. Please add credits to your OpenAI account and try again.";
    }
    
    if (error?.message) {
      return `Error: ${error.message}. Please try again or check your API configuration.`;
    }
    
    return "An error occurred while processing your request. Please check your API configuration and try again.";
  }
};