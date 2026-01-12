import { NextResponse } from 'next/server'
import { getPrisma } from '@/lib/prisma'

const DEFAULT_USER_ID = 1

// GET - 获取指定日期的待办事项
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')

    if (!date) {
      return NextResponse.json({ error: 'Date parameter is required' }, { status: 400 })
    }

    const prisma = await getPrisma()
    const todos = await prisma.dailyTodo.findMany({
      where: {
        userId: DEFAULT_USER_ID,
        date: date
      },
      orderBy: { sortOrder: 'asc' },
    })
    return NextResponse.json(todos)
  } catch (error) {
    console.error('Failed to fetch todos:', error)
    return NextResponse.json({ error: 'Failed to fetch todos' }, { status: 500 })
  }
}

// POST - 创建新待办事项
export async function POST(request: Request) {
  try {
    const prisma = await getPrisma()
    const data = await request.json()

    // 获取当前最大排序值
    const maxOrder = await prisma.dailyTodo.findFirst({
      where: { userId: DEFAULT_USER_ID, date: data.date },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true }
    })

    const todo = await prisma.dailyTodo.create({
      data: {
        userId: DEFAULT_USER_ID,
        date: data.date,
        text: data.text,
        completed: false,
        sortOrder: (maxOrder?.sortOrder ?? -1) + 1,
      },
    })
    return NextResponse.json(todo)
  } catch (error) {
    console.error('Failed to create todo:', error)
    return NextResponse.json({ error: 'Failed to create todo' }, { status: 500 })
  }
}

// PUT - 更新待办事项（切换完成状态）
export async function PUT(request: Request) {
  try {
    const prisma = await getPrisma()
    const data = await request.json()

    const todo = await prisma.dailyTodo.update({
      where: { id: data.id },
      data: {
        completed: data.completed,
        text: data.text,
      },
    })
    return NextResponse.json(todo)
  } catch (error) {
    console.error('Failed to update todo:', error)
    return NextResponse.json({ error: 'Failed to update todo' }, { status: 500 })
  }
}

// DELETE - 删除待办事项
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID parameter is required' }, { status: 400 })
    }

    const prisma = await getPrisma()
    await prisma.dailyTodo.delete({
      where: { id: parseInt(id) },
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete todo:', error)
    return NextResponse.json({ error: 'Failed to delete todo' }, { status: 500 })
  }
}
