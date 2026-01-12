import { NextResponse } from 'next/server'
import { getPrisma } from '@/lib/prisma'

export async function GET() {
  const rawUrl = process.env.TURSO_DATABASE_URL || ''

  const info: Record<string, unknown> = {
    hasTursoUrl: !!process.env.TURSO_DATABASE_URL,
    hasTursoToken: !!process.env.TURSO_AUTH_TOKEN,
    rawUrlPrefix: rawUrl.substring(0, 60),
    nodeEnv: process.env.NODE_ENV,
  }

  // Test raw libsql connection
  try {
    if (rawUrl && process.env.TURSO_AUTH_TOKEN) {
      const { createClient } = await import('@libsql/client/http')
      const client = createClient({
        url: rawUrl,
        authToken: process.env.TURSO_AUTH_TOKEN,
      })

      const result = await client.execute('SELECT COUNT(*) as count FROM course_material_costs')
      info.libsqlConnection = 'success'
      info.courseCount = result.rows[0]?.count
    } else {
      info.libsqlConnection = 'no turso credentials'
    }
  } catch (error) {
    info.libsqlConnection = 'failed'
    info.libsqlError = error instanceof Error ? error.message : String(error)
  }

  // Test Prisma connection
  try {
    const prisma = await getPrisma()
    const materials = await prisma.courseMaterialCost.findMany({
      where: { userId: 1, isActive: true },
      take: 1,
    })
    info.prismaConnection = 'success'
    info.prismaResult = materials.length
  } catch (error) {
    info.prismaConnection = 'failed'
    info.prismaError = error instanceof Error ? error.message : String(error)
    info.prismaStack = error instanceof Error ? error.stack?.substring(0, 800) : undefined
  }

  return NextResponse.json(info)
}
