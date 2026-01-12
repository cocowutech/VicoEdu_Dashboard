import { NextResponse } from 'next/server'
import { getPrisma } from '@/lib/prisma'

const DEFAULT_USER_ID = 1

// GET - 获取财务场景
export async function GET(request: Request) {
  try {
    const prisma = await getPrisma()
    const { searchParams } = new URL(request.url)
    const defaultOnly = searchParams.get('default')

    if (defaultOnly === 'true') {
      const scenario = await prisma.financialScenario.findFirst({
        where: { userId: DEFAULT_USER_ID, isDefault: true },
      })
      return NextResponse.json(scenario)
    }

    const scenarios = await prisma.financialScenario.findMany({
      where: { userId: DEFAULT_USER_ID },
      orderBy: { updatedAt: 'desc' },
    })
    return NextResponse.json(scenarios)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch scenarios' }, { status: 500 })
  }
}

// POST - 保存财务场景
export async function POST(request: Request) {
  try {
    const prisma = await getPrisma()
    const data = await request.json()

    // 如果设为默认，先取消其他默认
    if (data.isDefault) {
      await prisma.financialScenario.updateMany({
        where: { userId: DEFAULT_USER_ID, isDefault: true },
        data: { isDefault: false },
      })
    }

    const scenario = await prisma.financialScenario.create({
      data: {
        userId: DEFAULT_USER_ID,
        scenarioName: data.scenarioName,
        scenarioType: data.scenarioType,
        liveClassCount: data.liveClassCount,
        liveStudentsPerClass: data.liveStudentsPerClass,
        livePricePerHour: data.livePricePerHour,
        liveHoursPerWeek: data.liveHoursPerWeek,
        liveCommissionRate: data.liveCommissionRate,
        campProductId: data.campProductId,
        campStudentCount: data.campStudentCount,
        campSalesRate: data.campSalesRate,
        campOpsRate: data.campOpsRate,
        campMaterialCost: data.campMaterialCost,
        totalRevenue: data.totalRevenue,
        totalCost: data.totalCost,
        netProfit: data.netProfit,
        profitMargin: data.profitMargin,
        isDefault: data.isDefault || false,
      },
    })
    return NextResponse.json(scenario)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save scenario' }, { status: 500 })
  }
}

// PUT - 更新财务场景
export async function PUT(request: Request) {
  try {
    const prisma = await getPrisma()
    const data = await request.json()

    if (data.isDefault) {
      await prisma.financialScenario.updateMany({
        where: { userId: DEFAULT_USER_ID, isDefault: true, id: { not: data.id } },
        data: { isDefault: false },
      })
    }

    const scenario = await prisma.financialScenario.update({
      where: { id: data.id },
      data: {
        scenarioName: data.scenarioName,
        liveClassCount: data.liveClassCount,
        liveStudentsPerClass: data.liveStudentsPerClass,
        livePricePerHour: data.livePricePerHour,
        liveHoursPerWeek: data.liveHoursPerWeek,
        liveCommissionRate: data.liveCommissionRate,
        campStudentCount: data.campStudentCount,
        campSalesRate: data.campSalesRate,
        campOpsRate: data.campOpsRate,
        campMaterialCost: data.campMaterialCost,
        totalRevenue: data.totalRevenue,
        totalCost: data.totalCost,
        netProfit: data.netProfit,
        profitMargin: data.profitMargin,
        isDefault: data.isDefault,
      },
    })
    return NextResponse.json(scenario)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update scenario' }, { status: 500 })
  }
}
