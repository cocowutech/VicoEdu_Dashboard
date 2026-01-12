import { NextRequest, NextResponse } from 'next/server'
import { getPrisma } from '@/lib/prisma'

const DEFAULT_USER_ID = 1

// GET - 获取所有预设产品
export async function GET() {
  try {
    const prisma = await getPrisma()
    const presetProducts = await prisma.presetProduct.findMany({
      where: { userId: DEFAULT_USER_ID, isActive: true },
      orderBy: { sortOrder: 'asc' },
    })
    return NextResponse.json(presetProducts)
  } catch (error) {
    console.error('Error fetching preset products:', error)
    return NextResponse.json({ error: 'Failed to fetch preset products' }, { status: 500 })
  }
}

// POST - 创建预设产品
export async function POST(request: NextRequest) {
  try {
    const prisma = await getPrisma()
    const data = await request.json()
    const presetProduct = await prisma.presetProduct.create({
      data: {
        userId: DEFAULT_USER_ID,
        name: data.name,
        defaultPrice: data.defaultPrice,
        defaultSalesRate: data.defaultSalesRate,
        defaultOpsRate: data.defaultOpsRate,
        defaultOtherCost: data.defaultOtherCost,
        examType: data.examType,
        hasLive: data.hasLive,
        campType: data.campType,
        sortOrder: data.sortOrder || 0,
        isActive: data.isActive ?? true,
      },
    })
    return NextResponse.json(presetProduct)
  } catch (error) {
    console.error('Error creating preset product:', error)
    return NextResponse.json({ error: 'Failed to create preset product' }, { status: 500 })
  }
}

// PUT - 更新预设产品
export async function PUT(request: NextRequest) {
  try {
    const prisma = await getPrisma()
    const data = await request.json()
    const { id, ...updateData } = data

    const presetProduct = await prisma.presetProduct.update({
      where: { id },
      data: updateData,
    })
    return NextResponse.json(presetProduct)
  } catch (error) {
    console.error('Error updating preset product:', error)
    return NextResponse.json({ error: 'Failed to update preset product' }, { status: 500 })
  }
}

// DELETE - 删除预设产品 (软删除)
export async function DELETE(request: NextRequest) {
  try {
    const prisma = await getPrisma()
    const { searchParams } = new URL(request.url)
    const id = parseInt(searchParams.get('id') || '0')

    await prisma.presetProduct.update({
      where: { id },
      data: { isActive: false },
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting preset product:', error)
    return NextResponse.json({ error: 'Failed to delete preset product' }, { status: 500 })
  }
}
