import { NextResponse } from 'next/server'
import { getPrisma } from '@/lib/prisma'

const DEFAULT_USER_ID = 1

// GET - 获取周跟踪列表或当前周
export async function GET(request: Request) {
  try {
    const prisma = await getPrisma()
    const { searchParams } = new URL(request.url)
    const current = searchParams.get('current')

    if (current === 'true') {
      // 获取当前周的记录
      const today = new Date()
      const weekStart = new Date(today)
      weekStart.setDate(today.getDate() - today.getDay() + 1) // 周一
      weekStart.setHours(0, 0, 0, 0)

      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekStart.getDate() + 6) // 周日
      weekEnd.setHours(23, 59, 59, 999)

      let weekly = await prisma.weeklyTracking.findFirst({
        where: {
          userId: DEFAULT_USER_ID,
          weekStart: { gte: weekStart },
          weekEnd: { lte: weekEnd },
        },
      })

      // 如果没有当前周的记录，创建一个
      if (!weekly) {
        weekly = await prisma.weeklyTracking.create({
          data: {
            userId: DEFAULT_USER_ID,
            weekStart,
            weekEnd,
            xhsPostsTarget: 4,
            xhsPostsActual: 0,
            newFollowersTarget: 50,
            newFollowersActual: 0,
            inquiriesTarget: 10,
            inquiriesActual: 0,
            trialStudentsTarget: 5,
            trialStudentsActual: 0,
            newEnrollmentsTarget: 3,
            newEnrollmentsActual: 0,
            revenueTarget: 10000,
            revenueActual: 0,
          },
        })
      }

      return NextResponse.json(weekly)
    }

    // 获取所有周记录
    const weeklyList = await prisma.weeklyTracking.findMany({
      where: { userId: DEFAULT_USER_ID },
      orderBy: { weekStart: 'desc' },
      take: 12, // 最近12周
    })
    return NextResponse.json(weeklyList)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch weekly tracking' }, { status: 500 })
  }
}

// PUT - 更新周跟踪
export async function PUT(request: Request) {
  try {
    const prisma = await getPrisma()
    const data = await request.json()
    const weekly = await prisma.weeklyTracking.update({
      where: { id: data.id },
      data: {
        xhsPostsTarget: data.xhsPostsTarget,
        xhsPostsActual: data.xhsPostsActual,
        newFollowersTarget: data.newFollowersTarget,
        newFollowersActual: data.newFollowersActual,
        inquiriesTarget: data.inquiriesTarget,
        inquiriesActual: data.inquiriesActual,
        trialStudentsTarget: data.trialStudentsTarget,
        trialStudentsActual: data.trialStudentsActual,
        newEnrollmentsTarget: data.newEnrollmentsTarget,
        newEnrollmentsActual: data.newEnrollmentsActual,
        revenueTarget: data.revenueTarget,
        revenueActual: data.revenueActual,
        wins: data.wins,
        challenges: data.challenges,
        nextWeekPriorities: data.nextWeekPriorities,
        onMainline: data.onMainline,
      },
    })
    return NextResponse.json(weekly)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update weekly tracking' }, { status: 500 })
  }
}
