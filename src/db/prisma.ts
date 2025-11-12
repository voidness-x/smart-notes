import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Create Prisma client with connection error handling
const createPrismaClient = () => {
  try {
    return new PrismaClient({
      log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    });
  } catch (error) {
    console.error("Failed to create Prisma client:", error);
    // Return a mock client that will fail gracefully
    throw new Error("Database connection failed. Please check DATABASE_URL environment variable.");
  }
};

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;