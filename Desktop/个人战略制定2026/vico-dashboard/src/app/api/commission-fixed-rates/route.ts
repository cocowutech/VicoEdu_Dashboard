import { NextRequest, NextResponse } from 'next/server'
import { getPrisma } from '@/lib/prisma'
const DEFAULT_USER_ID = 1

const isStaffRequest = (request: NextRequest) => request.cookies.get('vico_role')?.value === 'staff'

// GET - 获取所有定额分配规则
export async function GET() {
  try {
    const prisma = await getPrisma()
    const rates = await prisma.commissionFixedRate.findMany({
      where: { userId: DEFAULT_USER_ID },
      orderBy: [
        { personName: 'asc' },
        { examType: 'asc' },
        { campType: 'asc' },
      ],
    })
    return NextResponse.json(rates)
  } catch (error) {
    console.error('Error fetching commission fixed rates:', error)
    return NextResponse.json({ error: 'Failed to fetch commission fixed rates' }, { status: 500 })
  }
}

// POST - 创建新定额分配规则
export async function POST(request: NextRequest) {
  if (isStaffRequest(request)) {
    return NextResponse.json({ error: 'Read-only access' }, { status: 403 })
  }
  try {
    const prisma = await getPrisma()
    const data = await request.json()

    const now = new Date()
    const rate = await prisma.commissionFixedRate.create({
      data: {
        userId: DEFAULT_USER_ID,
        personName: data.personName,
        examType: data.examType,
        campType: data.campType,
        amountPerStudent: data.amountPerStudent || 0,
        allocationType: data.allocationType || 'fixed',
        updatedAt: now,
      },
    })
    return NextResponse.json(rate)
  } catch (error) {
    console.error('Error creating commission fixed rate:', error)
    return NextResponse.json({ error: 'Failed to create commission fixed rate' }, { status: 500 })
  }
}

// PUT - 更新定额分配规则
export async function PUT(request: NextRequest) {
  if (isStaffRequest(request)) {
    return NextResponse.json({ error: 'Read-only access' }, { status: 403 })
  }
  try {
    const prisma = await getPrisma()
    const data = await request.json()
    const { id, ...updateData } = data

    const rate = await prisma.commissionFixedRate.update({
      where: { id },
      data: updateData,
    })
    return NextResponse.json(rate)
  } catch (error) {
    console.error('Error updating commission fixed rate:', error)
    return NextResponse.json({ error: 'Failed to update commission fixed rate' }, { status: 500 })
  }
}

// DELETE - 删除定额分配规则
export async function DELETE(request: NextRequest) {
  if (isStaffRequest(request)) {
    return NextResponse.json({ error: 'Read-only access' }, { status: 403 })
  }
  try {
    const prisma = await getPrisma()
    const { searchParams } = new URL(request.url)
    const id = parseInt(searchParams.get('id') || '0')

    await prisma.commissionFixedRate.delete({
      where: { id },
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting commission fixed rate:', error)
    return NextResponse.json({ error: 'Failed to delete commission fixed rate' }, { status: 500 })
  }
}
