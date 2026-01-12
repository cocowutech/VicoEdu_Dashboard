import { NextRequest, NextResponse } from 'next/server'
import { getPrisma } from '@/lib/prisma'
const DEFAULT_USER_ID = 1

// GET - 获取所有分佣规则
export async function GET() {
  try {
    const prisma = await getPrisma()
    const rules = await prisma.commissionRule.findMany({
      where: { userId: DEFAULT_USER_ID },
      orderBy: [
        { productType: 'asc' },
        { minStudents: 'asc' },
      ],
    })
    return NextResponse.json(rules)
  } catch (error) {
    console.error('Error fetching commission rules:', error)
    return NextResponse.json({ error: 'Failed to fetch commission rules' }, { status: 500 })
  }
}

// POST - 创建新分佣规则
export async function POST(request: NextRequest) {
  try {
    const prisma = await getPrisma()
    const data = await request.json()

    const rule = await prisma.commissionRule.create({
      data: {
        userId: DEFAULT_USER_ID,
        productType: data.productType,
        minStudents: data.minStudents,
        maxStudents: data.maxStudents || null,
        cocoRate: data.cocoRate,
        zoeyRate: data.zoeyRate,
        echoRate: data.echoRate,
      },
    })
    return NextResponse.json(rule)
  } catch (error) {
    console.error('Error creating commission rule:', error)
    return NextResponse.json({ error: 'Failed to create commission rule' }, { status: 500 })
  }
}

// PUT - 更新分佣规则
export async function PUT(request: NextRequest) {
  try {
    const prisma = await getPrisma()
    const data = await request.json()
    const { id, ...updateData } = data

    const rule = await prisma.commissionRule.update({
      where: { id },
      data: updateData,
    })
    return NextResponse.json(rule)
  } catch (error) {
    console.error('Error updating commission rule:', error)
    return NextResponse.json({ error: 'Failed to update commission rule' }, { status: 500 })
  }
}

// DELETE - 删除分佣规则
export async function DELETE(request: NextRequest) {
  try {
    const prisma = await getPrisma()
    const { searchParams } = new URL(request.url)
    const id = parseInt(searchParams.get('id') || '0')

    await prisma.commissionRule.delete({
      where: { id },
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting commission rule:', error)
    return NextResponse.json({ error: 'Failed to delete commission rule' }, { status: 500 })
  }
}
