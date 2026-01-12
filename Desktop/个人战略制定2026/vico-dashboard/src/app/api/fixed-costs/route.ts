import { NextRequest, NextResponse } from 'next/server'
import { getPrisma } from '@/lib/prisma'

const DEFAULT_USER_ID = 1

// GET - 获取所有固定成本
export async function GET() {
  try {
    const prisma = await getPrisma()
    const fixedCosts = await prisma.fixedCost.findMany({
      where: { userId: DEFAULT_USER_ID },
      orderBy: { createdAt: 'asc' },
    })
    return NextResponse.json(fixedCosts)
  } catch (error) {
    console.error('Error fetching fixed costs:', error)
    return NextResponse.json({ error: 'Failed to fetch fixed costs' }, { status: 500 })
  }
}

// POST - 创建新固定成本
export async function POST(request: NextRequest) {
  try {
    const prisma = await getPrisma()
    const data = await request.json()
    const fixedCost = await prisma.fixedCost.create({
      data: {
        userId: DEFAULT_USER_ID,
        name: data.name || '新成本项',
        amount: data.amount || 0,
        frequency: data.frequency || 'monthly',
        notes: data.notes || null,
      },
    })
    return NextResponse.json(fixedCost)
  } catch (error) {
    console.error('Error creating fixed cost:', error)
    return NextResponse.json({ error: 'Failed to create fixed cost' }, { status: 500 })
  }
}

// PUT - 更新固定成本
export async function PUT(request: NextRequest) {
  try {
    const prisma = await getPrisma()
    const data = await request.json()
    const { id, ...updateData } = data

    const fixedCost = await prisma.fixedCost.update({
      where: { id },
      data: updateData,
    })
    return NextResponse.json(fixedCost)
  } catch (error) {
    console.error('Error updating fixed cost:', error)
    return NextResponse.json({ error: 'Failed to update fixed cost' }, { status: 500 })
  }
}

// DELETE - 删除固定成本
export async function DELETE(request: NextRequest) {
  try {
    const prisma = await getPrisma()
    const { searchParams } = new URL(request.url)
    const id = parseInt(searchParams.get('id') || '0')

    await prisma.fixedCost.delete({
      where: { id },
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting fixed cost:', error)
    return NextResponse.json({ error: 'Failed to delete fixed cost' }, { status: 500 })
  }
}
