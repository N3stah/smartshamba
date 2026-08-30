// lib/prisma.ts
import { PrismaClient, Prisma } from "@prisma/client";

/**
 * Safely constructs the Database URL with connection pooling parameters.
 * Uses the native URL API to prevent malformed strings.
 */
function getDatabaseUrl(): string {
  const baseUrl = process.env.DATABASE_URL || "";
  if (!baseUrl) return "";

  try {
    const url = new URL(baseUrl);
    // Only apply direct connection limits if not using PgBouncer (port 6543)
    // Supabase direct connections (port 5432) need strict limits for serverless.
    if (url.port !== "6543") {
      if (!url.searchParams.has("connection_limit")) {
        url.searchParams.set("connection_limit", "5");
      }
      if (!url.searchParams.has("pool_timeout")) {
        url.searchParams.set("pool_timeout", "10"); // 10s timeout to acquire connection
      }
      if (!url.searchParams.has("socket_timeout")) {
        url.searchParams.set("socket_timeout", "30"); // 30s timeout for queries
      }
    }
    return url.toString();
  } catch {
    console.error("[DB] Failed to parse DATABASE_URL, using raw value.");
    return baseUrl;
  }
}

const globalForPrisma = global as unknown as {
  prisma: PrismaClient;
};

// Singleton pattern to prevent connection exhaustion on hot reloads / serverless reuse
export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    datasources: {
      db: {
        url: getDatabaseUrl(),
      },
    },
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// Prisma error codes that indicate a transient connection issue or timeout
const RETRIABLE_ERROR_CODES = [
  "P1001", // Connection timed out
  "P1002", // Connection was closed
  "P1017", // Server closed connection unexpectedly
  "P2024", // Timed out fetching a connection from the pool
  "P2025", // Database timeout
];

/**
 * Utility function to retry database operations on transient connection errors.
 * Uses exponential backoff with jitter to prevent thundering herds.
 */
export async function withDatabaseRetry<T>(
  operation: () => Promise<T>,
  retries = 3,
  baseDelay = 500
): Promise<T> {
  try {
    return await operation();
  } catch (error: unknown) {
    const code = (error as { code?: string })?.code;
    if (retries > 0 && code && RETRIABLE_ERROR_CODES.includes(code)) {
      // Calculate exponential backoff with jitter
      const jitter = Math.random() * 200;
      const delay = baseDelay * Math.pow(2, 3 - retries) + jitter;
      
      console.warn(`[DB] Transient error (${code}). Retrying in ${Math.round(delay)}ms... (${retries} attempts left)`);
      await new Promise((resolve) => setTimeout(resolve, delay));
      
      return withDatabaseRetry(operation, retries - 1, baseDelay);
    }
    throw error; // Re-throw non-retriable errors or if retries exhausted
  }
}

/**
 * Wrapper for prisma.$transaction to enforce strict timeout limits.
 * Prevents transactions from hanging indefinitely if the database is under heavy load.
 * 
 * @param fn The transaction logic
 * @param options Optional configuration
 *   - maxWait: Maximum time (ms) to wait for a connection from the pool (default: 5000)
 *   - timeout: Maximum time (ms) for the transaction to execute (default: 10000)
 */
export async function safeTransaction<T>(
  fn: (tx: Prisma.TransactionClient) => Promise<T>,
  options?: { maxWait?: number; timeout?: number; isolationLevel?: Prisma.TransactionIsolationLevel }
): Promise<T> {
  return withDatabaseRetry(() =>
    prisma.$transaction(fn, {
      maxWait: options?.maxWait ?? 5000,       // 5 seconds to acquire a connection
      timeout: options?.timeout ?? 10000,      // 10 seconds for the transaction to complete
      isolationLevel: options?.isolationLevel,
    })
  );
}
