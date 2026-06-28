import { PrismaClient } from '@prisma/client'

// Force fresh client every time in dev
export const db = new PrismaClient({
  log: ['query'],
})