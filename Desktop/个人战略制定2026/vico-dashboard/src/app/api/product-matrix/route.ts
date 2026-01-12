import { NextResponse } from 'next/server'
import { getPrisma } from '@/lib/prisma'

const DEFAULT_USER_ID = 1

// GET - 获取所有产品矩阵项目
export async function GET() {
  try {
    const prisma = await getPrisma()
    const items = await prisma.productMatrixItem.findMany({
      where: { userId: DEFAULT_USER_ID, isActive: true },
      orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }],
    })
    return NextResponse.json(items)
  } catch (error) {
    console.error('Failed to fetch product matrix:', error)
    return NextResponse.json({ error: 'Failed to fetch product matrix' }, { status: 500 })
  }
}

// PUT - 更新产品矩阵项目
export async function PUT(request: Request) {
  try {
    const prisma = await getPrisma()
    const data = await request.json()
    const { id, ...updateData } = data
    const item = await prisma.productMatrixItem.update({
      where: { id },
      data: updateData,
    })
    return NextResponse.json(item)
  } catch (error) {
    console.error('Failed to update product matrix item:', error)
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }
}

// POST - 创建新产品矩阵项目
export async function POST(request: Request) {
  try {
    const prisma = await getPrisma()
    const data = await request.json()

    // Get max sort order for this category
    const maxSort = await prisma.productMatrixItem.findFirst({
      where: { userId: DEFAULT_USER_ID, category: data.category },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    })

    const item = await prisma.productMatrixItem.create({
      data: {
        userId: DEFAULT_USER_ID,
        category: data.category,
        itemType: data.itemType || 'custom',
        itemName: data.itemName || '新项目',
        itemValue: data.itemValue || null,
        itemValue2: data.itemValue2 || null,
        colorClass: data.colorClass || 'gray',
        isOutsourced: data.isOutsourced || false,
        sortOrder: (maxSort?.sortOrder || 0) + 1,
      },
    })
    return NextResponse.json(item)
  } catch (error) {
    console.error('Failed to create product matrix item:', error)
    return NextResponse.json({ error: 'Failed to create' }, { status: 500 })
  }
}

// DELETE - 删除产品矩阵项目
export async function DELETE(request: Request) {
  try {
    const prisma = await getPrisma()
    const { searchParams } = new URL(request.url)
    const id = parseInt(searchParams.get('id') || '0')
    await prisma.productMatrixItem.delete({
      where: { id },
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete product matrix item:', error)
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }
}
