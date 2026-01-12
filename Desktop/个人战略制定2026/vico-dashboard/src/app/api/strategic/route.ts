import { NextResponse } from 'next/server'
import { getPrisma } from '@/lib/prisma'

const DEFAULT_USER_ID = 1

// GET - 获取战略定位
export async function GET() {
  try {
    const prisma = await getPrisma()
    const strategic = await prisma.strategicPositioning.findUnique({
      where: { userId: DEFAULT_USER_ID },
    })
    return NextResponse.json(strategic)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch strategic positioning' }, { status: 500 })
  }
}

// PUT - 更新战略定位
export async function PUT(request: Request) {
  try {
    const prisma = await getPrisma()
    const data = await request.json()
    const strategic = await prisma.strategicPositioning.upsert({
      where: { userId: DEFAULT_USER_ID },
      update: {
        currentPhase: data.currentPhase,
        oneLiner: data.oneLiner,
        dimension1: data.dimension1,
        dimension2: data.dimension2,
        dimension3: data.dimension3,
        strategicFocus: data.strategicFocus,
      },
      create: {
        userId: DEFAULT_USER_ID,
        currentPhase: data.currentPhase,
        oneLiner: data.oneLiner,
        dimension1: data.dimension1,
        dimension2: data.dimension2,
        dimension3: data.dimension3,
        strategicFocus: data.strategicFocus,
      },
    })
    return NextResponse.json(strategic)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update strategic positioning' }, { status: 500 })
  }
}
