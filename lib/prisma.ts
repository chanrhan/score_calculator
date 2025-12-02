import { PrismaClient } from '@prisma/client'

// 환경 변수 설정
process.env.DATABASE_URL = "postgresql://postgres:0915@localhost:5432/score_calculator"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma 