import { NextRequest, NextResponse } from 'next/server'
import { getPrisma } from '@/lib/prisma'
const DEFAULT_USER_ID = 1

// GET - 获取所有课程教材成本
export async function GET() {
  try {
    const prisma = await getPrisma()
    const materials = await prisma.courseMaterialCost.findMany({
      where: { userId: DEFAULT_USER_ID, isActive: true },
      orderBy: { sortOrder: 'asc' },
    })
    return NextResponse.json(materials)
  } catch (error) {
    console.error('Error fetching course materials:', error)
    return NextResponse.json({ error: 'Failed to fetch course materials' }, { status: 500 })
  }
}

// POST - 创建新课程教材成本
export async function POST(request: NextRequest) {
  try {
    const prisma = await getPrisma()
    const data = await request.json()
    const material = await prisma.courseMaterialCost.create({
      data: {
        userId: DEFAULT_USER_ID,
        courseName: data.courseName || '新课程',
        retailPrice: data.retailPrice || 0,
        materialCost: data.materialCost || 0,
        hasLive: data.hasLive || false,
        qianTeacherFee: data.qianTeacherFee || 0,
        salesCommissionRate: data.salesCommissionRate || 0,
        defaultCampDuration: data.defaultCampDuration || 0,
        sortOrder: data.sortOrder || 0,
      },
    })
    return NextResponse.json(material)
  } catch (error) {
    console.error('Error creating course material:', error)
    return NextResponse.json({ error: 'Failed to create course material' }, { status: 500 })
  }
}

// PUT - 更新课程教材成本
export async function PUT(request: NextRequest) {
  try {
    const prisma = await getPrisma()
    const data = await request.json()
    const { id, ...updateData } = data

    const material = await prisma.courseMaterialCost.update({
      where: { id },
      data: updateData,
    })
    return NextResponse.json(material)
  } catch (error) {
    console.error('Error updating course material:', error)
    return NextResponse.json({ error: 'Failed to update course material' }, { status: 500 })
  }
}

// DELETE - 删除课程教材成本(软删除)
export async function DELETE(request: NextRequest) {
  try {
    const prisma = await getPrisma()
    const { searchParams } = new URL(request.url)
    const id = parseInt(searchParams.get('id') || '0')

    await prisma.courseMaterialCost.update({
      where: { id },
      data: { isActive: false },
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting course material:', error)
    return NextResponse.json({ error: 'Failed to delete course material' }, { status: 500 })
  }
}
