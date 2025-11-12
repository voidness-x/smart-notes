import { z } from "zod";

export const noteIdSchema = z.string().uuid();
export const noteTextSchema = z.string().max(5000000);
export const noteTitleSchema = z.string().max(500).trim();
export const noteTagsSchema = z.array(z.string().max(50).trim().toLowerCase()).max(20);
export const emailSchema = z.string().email().max(255);
export const passwordSchema = z.string().min(8).max(128);
export const ratingSchema = z.number().int().min(1).max(5);
export const commentSchema = z.string().max(5000).trim();
export const supportTitleSchema = z.string().min(3).max(200).trim();
export const supportDescriptionSchema = z.string().min(10).max(5000).trim();
export const questionSchema = z.string().min(1).max(1000).trim();
export const userNameSchema = z.string().max(100).trim();
export const inviteTokenSchema = z.string().length(64);

export function validateInput<T>(schema: z.ZodSchema<T>, input: unknown): { success: true; data: T } | { success: false; error: string } {
  try {
    return { success: true, data: schema.parse(input) };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0]?.message || "Validation failed" };
    }
    return { success: false, error: "Validation failed" };
  }
}

