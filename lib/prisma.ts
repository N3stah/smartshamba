// lib/prisma.ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as {
  prisma: PrismaClient;
};

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

/**
 * Utility function to retry database operations on transient connection errors.
 * Useful for serverless environments where cold starts can cause brief connection drops.
 */
export async function withDatabaseRetry<T>(
  operation: () => Promise<T>,
  retries = 3,
  delay = 1000
): Promise<T> {
  try {
    return await operation();
  } catch (error: any) {
    // P1001: Connection timed out, P1002: Connection was closed, P1017: Server closed connection
    if (retries > 0 && (error.code === 'P1001' || error.code === 'P1002' || error.code === 'P1017')) {
      console.log(`[DB] Connection error, retrying... (${retries} attempts left)`);
      await new Promise((resolve) => setTimeout(resolve, delay));
      return withDatabaseRetry(operation, retries - 1, delay * 2);
    }
    throw error;
  }
}
