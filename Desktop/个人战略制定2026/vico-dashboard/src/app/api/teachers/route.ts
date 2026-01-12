import { NextRequest, NextResponse } from 'next/server'
import { getPrisma } from '@/lib/prisma'

const DEFAULT_USER_ID = 1

// GET - 获取所有教师
export async function GET() {
  try {
    const prisma = await getPrisma()
    const teachers = await prisma.teacher.findMany({
      where: { userId: DEFAULT_USER_ID, isActive: true },
      orderBy: { createdAt: 'asc' },
    })

    // 如果没有教师，创建默认的 Coco
    if (teachers.length === 0) {
      const coco = await prisma.teacher.create({
        data: {
          userId: DEFAULT_USER_ID,
          name: 'Coco',
          hourlyRate: 0,
        },
      })
      return NextResponse.json([coco])
    }

    return NextResponse.json(teachers)
  } catch (error) {
    console.error('Error fetching teachers:', error)
    return NextResponse.json({ error: 'Failed to fetch teachers' }, { status: 500 })
  }
}

// POST - 创建新教师
export async function POST(request: NextRequest) {
  try {
    const prisma = await getPrisma()
    const data = await request.json()
    const teacherName = data.name?.trim() || '新教师'
    const teacher = await prisma.teacher.create({
      data: {
        userId: DEFAULT_USER_ID,
        name: teacherName,
        hourlyRate: Number(data.hourlyRate) || 0,
        isSelf: false,
      },
    })
    return NextResponse.json(teacher)
  } catch (error) {
    console.error('Error creating teacher:', error)
    return NextResponse.json({ error: 'Failed to create teacher' }, { status: 500 })
  }
}

// PUT - 更新教师
export async function PUT(request: NextRequest) {
  try {
    const prisma = await getPrisma()
    const data = await request.json()
    const { id, ...updateData } = data

    const teacher = await prisma.teacher.update({
      where: { id },
      data: updateData,
    })
    return NextResponse.json(teacher)
  } catch (error) {
    console.error('Error updating teacher:', error)
    return NextResponse.json({ error: 'Failed to update teacher' }, { status: 500 })
  }
}

// DELETE - 删除教师(软删除)
export async function DELETE(request: NextRequest) {
  try {
    const prisma = await getPrisma()
    const { searchParams } = new URL(request.url)
    const id = parseInt(searchParams.get('id') || '0')

    await prisma.teacher.update({
      where: { id },
      data: { isActive: false },
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting teacher:', error)
    return NextResponse.json({ error: 'Failed to delete teacher' }, { status: 500 })
  }
}
