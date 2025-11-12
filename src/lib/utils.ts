import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const handleError = (error: unknown) => {
  if (error instanceof Error) return { errorMessage: error.message };
  if (error && typeof error === "object" && "message" in error) return { errorMessage: String(error.message) };
    return { errorMessage: "An error occurred" };
}