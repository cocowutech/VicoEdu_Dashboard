import { NextResponse } from 'next/server'
import { getPrisma } from '@/lib/prisma'

const DEFAULT_USER_ID = 1

// DELETE - 清除指定日期的所有已完成待办事项
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')

    if (!date) {
      return NextResponse.json({ error: 'Date parameter is required' }, { status: 400 })
    }

    const prisma = await getPrisma()
    await prisma.dailyTodo.deleteMany({
      where: {
        userId: DEFAULT_USER_ID,
        date: date,
        completed: true,
      },
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to clear completed todos:', error)
    return NextResponse.json({ error: 'Failed to clear completed todos' }, { status: 500 })
  }
}
