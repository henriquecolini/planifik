// lib/prisma.ts — Singleton Prisma client for Next.js
// In development, hot-reloading creates multiple instances without this pattern.

import { PrismaClient } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined;
};

function createPrismaClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  }).$extends({
    result: {
      itemBalance: {
        amount: {
          needs: { amount: true },
          compute(data) {
            return Number(data.amount);
          },
        },
      },
    },
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
