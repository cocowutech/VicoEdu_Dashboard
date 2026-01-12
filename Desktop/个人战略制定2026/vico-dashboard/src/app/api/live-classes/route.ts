import { NextRequest, NextResponse } from 'next/server'
import { getPrisma } from '@/lib/prisma'

const DEFAULT_USER_ID = 1

// GET - 获取所有直播课班级
export async function GET() {
  try {
    const prisma = await getPrisma()
    const liveClasses = await prisma.liveClass.findMany({
      where: { userId: DEFAULT_USER_ID },
      include: { teacher: true },
      orderBy: { createdAt: 'asc' },
    })
    return NextResponse.json(liveClasses)
  } catch (error) {
    console.error('Error fetching live classes:', error)
    return NextResponse.json({ error: 'Failed to fetch live classes' }, { status: 500 })
  }
}

// POST - 创建新班级
export async function POST(request: NextRequest) {
  try {
    const prisma = await getPrisma()
    const data = await request.json()

    // 获取默认教师(Coco)
    let defaultTeacher = await prisma.teacher.findFirst({
      where: { userId: DEFAULT_USER_ID, isSelf: true },
    })

    // 如果没有默认教师，创建一个
    if (!defaultTeacher) {
      defaultTeacher = await prisma.teacher.create({
        data: {
          userId: DEFAULT_USER_ID,
          name: 'Coco',
          hourlyRate: 0,
          isSelf: true,
        },
      })
    }

    const liveClass = await prisma.liveClass.create({
      data: {
        userId: DEFAULT_USER_ID,
        name: data.name || '新班级',
        lessonPricePerStudent: data.lessonPricePerStudent || 700,
        studentCount: data.studentCount || 5,
        lessonDuration: data.lessonDuration || 2,
        weeklyLessons: data.weeklyLessons || 2,
        teacherId: data.teacherId || defaultTeacher.id,
        totalLessons: data.totalLessons || 15,
      },
      include: { teacher: true },
    })
    return NextResponse.json(liveClass)
  } catch (error) {
    console.error('Error creating live class:', error)
    return NextResponse.json({ error: 'Failed to create live class' }, { status: 500 })
  }
}

// PUT - 更新班级
export async function PUT(request: NextRequest) {
  try {
    const prisma = await getPrisma()
    const data = await request.json()
    const { id, ...updateData } = data

    const liveClass = await prisma.liveClass.update({
      where: { id },
      data: updateData,
      include: { teacher: true },
    })
    return NextResponse.json(liveClass)
  } catch (error) {
    console.error('Error updating live class:', error)
    return NextResponse.json({ error: 'Failed to update live class' }, { status: 500 })
  }
}

// DELETE - 删除班级
export async function DELETE(request: NextRequest) {
  try {
    const prisma = await getPrisma()
    const { searchParams } = new URL(request.url)
    const id = parseInt(searchParams.get('id') || '0')

    await prisma.liveClass.delete({
      where: { id },
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting live class:', error)
    return NextResponse.json({ error: 'Failed to delete live class' }, { status: 500 })
  }
}
