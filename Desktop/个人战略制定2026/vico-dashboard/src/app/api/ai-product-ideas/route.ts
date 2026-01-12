import { NextResponse } from 'next/server'
import { getPrisma } from '@/lib/prisma'

const DEFAULT_USER_ID = 1

// GET - 获取所有AI产品升级方向
export async function GET() {
  try {
    const prisma = await getPrisma()
    const ideas = await prisma.aiProductIdea.findMany({
      where: { userId: DEFAULT_USER_ID, isActive: true },
      orderBy: { sortOrder: 'asc' },
    })
    return NextResponse.json(ideas)
  } catch (error) {
    console.error('Failed to fetch AI product ideas:', error)
    return NextResponse.json({ error: 'Failed to fetch AI product ideas' }, { status: 500 })
  }
}

// PUT - 更新AI产品升级方向
export async function PUT(request: Request) {
  try {
    const prisma = await getPrisma()
    const data = await request.json()
    const { id, ...updateData } = data
    const idea = await prisma.aiProductIdea.update({
      where: { id },
      data: updateData,
    })
    return NextResponse.json(idea)
  } catch (error) {
    console.error('Failed to update AI product idea:', error)
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }
}

// POST - 创建新AI产品升级方向
export async function POST(request: Request) {
  try {
    const prisma = await getPrisma()
    const data = await request.json()

    // Get max sort order
    const maxSort = await prisma.aiProductIdea.findFirst({
      where: { userId: DEFAULT_USER_ID },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    })

    const idea = await prisma.aiProductIdea.create({
      data: {
        userId: DEFAULT_USER_ID,
        title: data.title || '新产品方向',
        icon: data.icon || '💡',
        colorTheme: data.colorTheme || 'amber',
        description: data.description || '产品描述...',
        testNote: data.testNote || '需测试：...',
        sortOrder: (maxSort?.sortOrder || 0) + 1,
      },
    })
    return NextResponse.json(idea)
  } catch (error) {
    console.error('Failed to create AI product idea:', error)
    return NextResponse.json({ error: 'Failed to create' }, { status: 500 })
  }
}

// DELETE - 删除AI产品升级方向
export async function DELETE(request: Request) {
  try {
    const prisma = await getPrisma()
    const { searchParams } = new URL(request.url)
    const id = parseInt(searchParams.get('id') || '0')
    await prisma.aiProductIdea.delete({
      where: { id },
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete AI product idea:', error)
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }
}
