import { NextRequest, NextResponse } from 'next/server'
import { getPrisma } from '@/lib/prisma'

const DEFAULT_USER_ID = 1

// GET - 获取所有录播陪跑营
export async function GET() {
  try {
    const prisma = await getPrisma()
    const recordedCamps = await prisma.recordedCamp.findMany({
      where: { userId: DEFAULT_USER_ID },
      orderBy: { createdAt: 'asc' },
    })
    return NextResponse.json(recordedCamps)
  } catch (error) {
    console.error('Error fetching recorded camps:', error)
    return NextResponse.json({ error: 'Failed to fetch recorded camps' }, { status: 500 })
  }
}

// POST - 创建新陪跑营
export async function POST(request: NextRequest) {
  try {
    const prisma = await getPrisma()
    const data = await request.json()
    const recordedCamp = await prisma.recordedCamp.create({
      data: {
        userId: DEFAULT_USER_ID,
        productId: data.productId || null,
        name: data.name || '新陪跑营',
        price: data.price || 7800,
        studentCount: data.studentCount || 15,
        salesCommissionRate: data.salesCommissionRate || 35,
        opsCommissionRate: data.opsCommissionRate || 65,
        otherCostPerStudent: data.otherCostPerStudent || 100,
      },
    })
    return NextResponse.json(recordedCamp)
  } catch (error) {
    console.error('Error creating recorded camp:', error)
    return NextResponse.json({ error: 'Failed to create recorded camp' }, { status: 500 })
  }
}

// PUT - 更新陪跑营
export async function PUT(request: NextRequest) {
  try {
    const prisma = await getPrisma()
    const data = await request.json()
    const { id, ...updateData } = data

    const recordedCamp = await prisma.recordedCamp.update({
      where: { id },
      data: updateData,
    })
    return NextResponse.json(recordedCamp)
  } catch (error) {
    console.error('Error updating recorded camp:', error)
    return NextResponse.json({ error: 'Failed to update recorded camp' }, { status: 500 })
  }
}

// DELETE - 删除陪跑营
export async function DELETE(request: NextRequest) {
  try {
    const prisma = await getPrisma()
    const { searchParams } = new URL(request.url)
    const id = parseInt(searchParams.get('id') || '0')

    await prisma.recordedCamp.delete({
      where: { id },
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting recorded camp:', error)
    return NextResponse.json({ error: 'Failed to delete recorded camp' }, { status: 500 })
  }
}
