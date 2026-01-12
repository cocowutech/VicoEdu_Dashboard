import { NextResponse } from 'next/server'
import { getPrisma } from '@/lib/prisma'

const DEFAULT_USER_ID = 1

// GET - 获取所有目标
export async function GET() {
  try {
    const prisma = await getPrisma()
    const goals = await prisma.goal.findMany({
      where: { userId: DEFAULT_USER_ID },
      orderBy: { createdAt: 'asc' },
    })
    return NextResponse.json(goals)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch goals' }, { status: 500 })
  }
}

// POST - 创建新目标
export async function POST(request: Request) {
  try {
    const prisma = await getPrisma()
    const data = await request.json()
    const goal = await prisma.goal.create({
      data: {
        userId: DEFAULT_USER_ID,
        goalType: data.goalType,
        goalName: data.goalName,
        targetValue: data.targetValue,
        currentValue: data.currentValue || 0,
        unit: data.unit,
        deadline: data.deadline ? new Date(data.deadline) : null,
        period: data.period,
        status: data.status || 'active',
      },
    })
    return NextResponse.json(goal)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create goal' }, { status: 500 })
  }
}

// PUT - 更新目标
export async function PUT(request: Request) {
  try {
    const prisma = await getPrisma()
    const data = await request.json()
    const goal = await prisma.goal.update({
      where: { id: data.id },
      data: {
        goalName: data.goalName,
        targetValue: data.targetValue,
        currentValue: data.currentValue,
        unit: data.unit,
        deadline: data.deadline ? new Date(data.deadline) : null,
        period: data.period,
        status: data.status,
      },
    })
    return NextResponse.json(goal)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update goal' }, { status: 500 })
  }
}
