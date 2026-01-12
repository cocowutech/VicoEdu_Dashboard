import { NextResponse } from 'next/server'
import { getPrisma } from '@/lib/prisma'

const DEFAULT_USER_ID = 1

// GET - 获取所有 AI 任务
export async function GET() {
  try {
    const prisma = await getPrisma()
    const tasks = await prisma.aiAutomation.findMany({
      where: { userId: DEFAULT_USER_ID },
      orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
    })
    return NextResponse.json(tasks)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch AI tasks' }, { status: 500 })
  }
}

// PUT - 更新 AI 任务
export async function PUT(request: Request) {
  try {
    const prisma = await getPrisma()
    const data = await request.json()
    const { id, ...updateData } = data
    const task = await prisma.aiAutomation.update({
      where: { id },
      data: updateData,
    })
    return NextResponse.json(task)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update AI task' }, { status: 500 })
  }
}

// POST - 创建新 AI 任务
export async function POST(request: Request) {
  try {
    const prisma = await getPrisma()
    const data = await request.json()
    const task = await prisma.aiAutomation.create({
      data: {
        userId: DEFAULT_USER_ID,
        taskName: data.taskName || '新工作流',
        description: data.description || null,
        toolSuggestion: data.toolSuggestion || null,
        priority: data.priority || 3,
        status: 'pending',
      },
    })
    return NextResponse.json(task)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create AI task' }, { status: 500 })
  }
}

// DELETE - 删除 AI 任务
export async function DELETE(request: Request) {
  try {
    const prisma = await getPrisma()
    const { searchParams } = new URL(request.url)
    const id = parseInt(searchParams.get('id') || '0')
    await prisma.aiAutomation.delete({
      where: { id },
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete AI task' }, { status: 500 })
  }
}
