import { NextResponse } from 'next/server'
import { getPrisma } from '@/lib/prisma'

const DEFAULT_USER_ID = 1

// GET - 获取所有计算记录
export async function GET() {
  try {
    const prisma = await getPrisma()
    const calculations = await prisma.commissionCalculation.findMany({
      where: { userId: DEFAULT_USER_ID },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(calculations)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch calculations' }, { status: 500 })
  }
}

// POST - 添加新计算记录
export async function POST(request: Request) {
  try {
    const prisma = await getPrisma()
    const data = await request.json()
    const calculation = await prisma.commissionCalculation.create({
      data: {
        userId: DEFAULT_USER_ID,
        courseName: data.courseName,
        studentCount: data.studentCount,
        hasLive: data.hasLive,
        retailPrice: data.retailPrice,
        totalRevenue: data.totalRevenue,
        materialCost: data.materialCost,
        salesCommission: data.salesCommission,
        qianTeacherFee: data.qianTeacherFee,
        distributionPool: data.distributionPool,
        cocoAmount: data.cocoAmount,
        zoeyAmount: data.zoeyAmount,
        echoAmount: data.echoAmount,
        cocoRate: data.cocoRate,
        zoeyRate: data.zoeyRate,
        echoRate: data.echoRate,
        startDate: data.startDate ? new Date(data.startDate) : null,
        campDuration: data.campDuration || 0,
        holidayDays: data.holidayDays || 0,
      },
    })
    return NextResponse.json(calculation)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create calculation' }, { status: 500 })
  }
}

// PUT - 更新计算记录
export async function PUT(request: Request) {
  try {
    const prisma = await getPrisma()
    const data = await request.json()
    const { id, ...updateData } = data

    // 处理日期字段
    if (updateData.startDate) {
      updateData.startDate = new Date(updateData.startDate)
    }

    const calculation = await prisma.commissionCalculation.update({
      where: { id },
      data: updateData,
    })
    return NextResponse.json(calculation)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update calculation' }, { status: 500 })
  }
}

// DELETE - 删除计算记录
export async function DELETE(request: Request) {
  try {
    const prisma = await getPrisma()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (id === 'all') {
      // 删除所有记录
      await prisma.commissionCalculation.deleteMany({
        where: { userId: DEFAULT_USER_ID },
      })
      return NextResponse.json({ success: true })
    }

    // 删除单个记录
    const calcId = parseInt(id || '0')
    await prisma.commissionCalculation.delete({
      where: { id: calcId },
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete calculation' }, { status: 500 })
  }
}
