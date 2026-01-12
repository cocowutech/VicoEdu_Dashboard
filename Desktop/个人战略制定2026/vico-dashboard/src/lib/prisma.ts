import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  prismaPromise: Promise<PrismaClient> | undefined
}

async function initPrismaClient(): Promise<PrismaClient> {
  // 如果设置了 Turso 数据库 URL（生产环境）
  if (process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN) {
    console.log('Initializing Turso database connection...')
    const { PrismaLibSQL } = await import('@prisma/adapter-libsql')
    const { createClient } = await import('@libsql/client/http')

    const libsql = createClient({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    })
    const adapter = new PrismaLibSQL(libsql)
    console.log('Turso connection established')
    return new PrismaClient({ adapter }) as PrismaClient
  }

  // 本地开发环境使用 SQLite
  console.log('Using local SQLite database')
  return new PrismaClient()
}

export async function getPrisma(): Promise<PrismaClient> {
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma
  }

  if (!globalForPrisma.prismaPromise) {
    globalForPrisma.prismaPromise = initPrismaClient()
  }

  const client = await globalForPrisma.prismaPromise
  globalForPrisma.prisma = client
  return client
}

// 同步版本，仅用于本地开发
export const prisma = new PrismaClient()
