import { PrismaClient } from '@prisma/client';

// A single shared database connection for the whole app.
export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'production' ? ['error'] : ['warn', 'error'],
});
