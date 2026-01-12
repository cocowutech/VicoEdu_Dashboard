import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Start seeding...')

  // 创建默认用户
  const user = await prisma.user.upsert({
    where: { email: 'vico@education.com' },
    update: {},
    create: {
      email: 'vico@education.com',
      passwordHash: 'default_hash',
      name: 'Vico',
    },
  })

  console.log('Created user:', user.email)

  // 创建战略定位
  await prisma.strategicPositioning.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      currentPhase: 'rising_transition',
      oneLiner: '通过社交媒体吸引创业家庭，以英语考试为入口，建立从KET到托福的升学服务闭环，最终转型为高净值家庭的教育顾问',
      dimension1: '考试研究→课纲→教学能力\n跨文化无障碍沟通\n哈佛资源、学术背书',
      dimension2: '孩子「空心病」：无自驱力\n底层学习力激发需求\n需要全程陪伴的家庭',
      dimension3: '年收入百万/千万创业家庭\n有执行力的家庭（阿姨/家教）\n认识这些家长的圈子',
      strategicFocus: '录播陪跑营 + 直播小班课 双轨发展',
    },
  })

  console.log('Created strategic positioning')

  // 创建预设产品 (12个)
  const presetProducts = [
    { name: 'KET全程营(带直播)', defaultPrice: 7800, defaultSalesRate: 35, defaultOpsRate: 65, defaultOtherCost: 100, examType: 'KET', hasLive: true, campType: 'full', sortOrder: 1 },
    { name: 'KET考冲营(带直播)', defaultPrice: 4800, defaultSalesRate: 35, defaultOpsRate: 65, defaultOtherCost: 80, examType: 'KET', hasLive: true, campType: 'sprint', sortOrder: 2 },
    { name: 'KET全程营(不带直播)', defaultPrice: 5800, defaultSalesRate: 25, defaultOpsRate: 65, defaultOtherCost: 100, examType: 'KET', hasLive: false, campType: 'full', sortOrder: 3 },
    { name: 'KET考冲营(不带直播)', defaultPrice: 3500, defaultSalesRate: 25, defaultOpsRate: 65, defaultOtherCost: 80, examType: 'KET', hasLive: false, campType: 'sprint', sortOrder: 4 },
    { name: 'PET全程营(带直播)', defaultPrice: 8800, defaultSalesRate: 35, defaultOpsRate: 65, defaultOtherCost: 120, examType: 'PET', hasLive: true, campType: 'full', sortOrder: 5 },
    { name: 'PET考冲营(带直播)', defaultPrice: 5800, defaultSalesRate: 35, defaultOpsRate: 65, defaultOtherCost: 80, examType: 'PET', hasLive: true, campType: 'sprint', sortOrder: 6 },
    { name: 'PET全程营(不带直播)', defaultPrice: 6000, defaultSalesRate: 25, defaultOpsRate: 65, defaultOtherCost: 120, examType: 'PET', hasLive: false, campType: 'full', sortOrder: 7 },
    { name: 'PET考冲营(不带直播)', defaultPrice: 4500, defaultSalesRate: 25, defaultOpsRate: 65, defaultOtherCost: 80, examType: 'PET', hasLive: false, campType: 'sprint', sortOrder: 8 },
    { name: 'FCE全程营(带直播)', defaultPrice: 12800, defaultSalesRate: 35, defaultOpsRate: 65, defaultOtherCost: 150, examType: 'FCE', hasLive: true, campType: 'full', sortOrder: 9 },
    { name: 'FCE考冲营(带直播)', defaultPrice: 9800, defaultSalesRate: 35, defaultOpsRate: 65, defaultOtherCost: 100, examType: 'FCE', hasLive: true, campType: 'sprint', sortOrder: 10 },
    { name: 'FCE全程营(不带直播)', defaultPrice: 7000, defaultSalesRate: 25, defaultOpsRate: 65, defaultOtherCost: 150, examType: 'FCE', hasLive: false, campType: 'full', sortOrder: 11 },
    { name: 'FCE教材部分', defaultPrice: 3000, defaultSalesRate: 25, defaultOpsRate: 65, defaultOtherCost: 80, examType: 'FCE', hasLive: false, campType: 'textbook', sortOrder: 12 },
  ]

  for (const product of presetProducts) {
    await prisma.presetProduct.create({
      data: {
        userId: user.id,
        ...product,
      },
    })
  }
  console.log('Created preset products:', presetProducts.length)

  // 创建默认直播课班级
  const liveClasses = [
    {
      name: 'PET周末班',
      studentHourlyRate: 350,
      studentCount: 6,
      lessonDuration: 1.5,
      weeklyLessons: 2,
      teacherHourlyRate: 200,
      totalLessons: 20,
    },
    {
      name: 'FCE强化班',
      studentHourlyRate: 400,
      studentCount: 4,
      lessonDuration: 2,
      weeklyLessons: 2,
      teacherHourlyRate: 250,
      totalLessons: 16,
    },
  ]

  for (const liveClass of liveClasses) {
    await prisma.liveClass.create({
      data: {
        userId: user.id,
        ...liveClass,
      },
    })
  }
  console.log('Created live classes:', liveClasses.length)

  // 创建默认录播陪跑营
  const recordedCamps = [
    {
      productId: 1, // KET全程营(带直播)
      name: 'KET全程营(带直播)-1月班',
      price: 7800,
      studentCount: 15,
      salesCommissionRate: 35,
      opsCommissionRate: 65,
      otherCostPerStudent: 100,
    },
    {
      productId: 8, // PET考冲营(不带直播)
      name: 'PET考冲营(不带直播)-寒假班',
      price: 4500,
      studentCount: 20,
      salesCommissionRate: 25,
      opsCommissionRate: 65,
      otherCostPerStudent: 80,
    },
  ]

  for (const camp of recordedCamps) {
    await prisma.recordedCamp.create({
      data: {
        userId: user.id,
        ...camp,
      },
    })
  }
  console.log('Created recorded camps:', recordedCamps.length)

  // 创建默认固定成本
  const fixedCosts = [
    { name: '小鹅通平台费', amount: 10000, frequency: 'yearly', notes: '年费10000元' },
    { name: '其他工具费', amount: 200, frequency: 'monthly', notes: null },
  ]

  for (const cost of fixedCosts) {
    await prisma.fixedCost.create({
      data: {
        userId: user.id,
        ...cost,
      },
    })
  }
  console.log('Created fixed costs:', fixedCosts.length)

  // 创建默认目标
  const goals = [
    { goalType: 'recruitment', goalName: '在班学生数', targetValue: 100, currentValue: 0, unit: '人', period: 'quarterly' },
    { goalType: 'recruitment', goalName: '录播营学生', targetValue: 50, currentValue: 0, unit: '人', period: 'quarterly' },
    { goalType: 'recruitment', goalName: '教师团队', targetValue: 3, currentValue: 0, unit: '人', period: 'quarterly' },
    { goalType: 'content', goalName: '小红书粉丝', targetValue: 1000, currentValue: 0, unit: '人', period: 'quarterly' },
    { goalType: 'financial', goalName: '月被动收入', targetValue: 40000, currentValue: 0, unit: '元', period: 'monthly' },
  ]

  for (const goal of goals) {
    await prisma.goal.create({
      data: {
        userId: user.id,
        ...goal,
      },
    })
  }

  console.log('Created goals:', goals.length)

  // 创建分佣规则 - 带直播产品
  const commissionRulesWithLive = [
    { productType: 'with_live', minStudents: 1, maxStudents: 3, cocoRate: 60, zoeyRate: 20, echoRate: 20 },
    { productType: 'with_live', minStudents: 4, maxStudents: 8, cocoRate: 50, zoeyRate: 25, echoRate: 25 },
    { productType: 'with_live', minStudents: 9, maxStudents: null, cocoRate: 40, zoeyRate: 30, echoRate: 30 },
  ]

  // 创建分佣规则 - 不带直播产品
  const commissionRulesWithoutLive = [
    { productType: 'without_live', minStudents: 1, maxStudents: 3, cocoRate: 30, zoeyRate: 35, echoRate: 35 },
    { productType: 'without_live', minStudents: 4, maxStudents: 8, cocoRate: 35, zoeyRate: 32.5, echoRate: 32.5 },
    { productType: 'without_live', minStudents: 9, maxStudents: null, cocoRate: 40, zoeyRate: 30, echoRate: 30 },
  ]

  const allCommissionRules = [...commissionRulesWithLive, ...commissionRulesWithoutLive]
  for (const rule of allCommissionRules) {
    await prisma.commissionRule.create({
      data: {
        userId: user.id,
        ...rule,
      },
    })
  }
  console.log('Created commission rules:', allCommissionRules.length)

  // 创建课程教材成本 (带直播: 钱老师费用0, 销售分佣40%; 不带直播: 钱老师费用200, 销售分佣25%)
  const courseMaterialCosts = [
    { courseName: 'KET全程营(带直播)', retailPrice: 7800, materialCost: 100, hasLive: true, qianTeacherFee: 0, salesCommissionRate: 40, sortOrder: 1 },
    { courseName: 'KET考冲营(带直播)', retailPrice: 4800, materialCost: 80, hasLive: true, qianTeacherFee: 0, salesCommissionRate: 40, sortOrder: 2 },
    { courseName: 'KET全程营(不带直播)', retailPrice: 5800, materialCost: 100, hasLive: false, qianTeacherFee: 200, salesCommissionRate: 25, sortOrder: 3 },
    { courseName: 'KET考冲营(不带直播)', retailPrice: 3500, materialCost: 80, hasLive: false, qianTeacherFee: 200, salesCommissionRate: 25, sortOrder: 4 },
    { courseName: 'PET全程营(带直播)', retailPrice: 8800, materialCost: 120, hasLive: true, qianTeacherFee: 0, salesCommissionRate: 40, sortOrder: 5 },
    { courseName: 'PET考冲营(带直播)', retailPrice: 5800, materialCost: 80, hasLive: true, qianTeacherFee: 0, salesCommissionRate: 40, sortOrder: 6 },
    { courseName: 'PET全程营(不带直播)', retailPrice: 6000, materialCost: 120, hasLive: false, qianTeacherFee: 200, salesCommissionRate: 25, sortOrder: 7 },
    { courseName: 'PET考冲营(不带直播)', retailPrice: 4500, materialCost: 80, hasLive: false, qianTeacherFee: 200, salesCommissionRate: 25, sortOrder: 8 },
    { courseName: 'FCE全程营(带直播)', retailPrice: 12800, materialCost: 150, hasLive: true, qianTeacherFee: 0, salesCommissionRate: 40, sortOrder: 9 },
    { courseName: 'FCE考冲营(带直播)', retailPrice: 9800, materialCost: 100, hasLive: true, qianTeacherFee: 0, salesCommissionRate: 40, sortOrder: 10 },
    { courseName: 'FCE全程营(不带直播)', retailPrice: 7000, materialCost: 150, hasLive: false, qianTeacherFee: 200, salesCommissionRate: 25, sortOrder: 11 },
    { courseName: 'FCE教材部分', retailPrice: 3000, materialCost: 80, hasLive: false, qianTeacherFee: 200, salesCommissionRate: 25, sortOrder: 12 },
  ]

  for (const material of courseMaterialCosts) {
    await prisma.courseMaterialCost.create({
      data: {
        userId: user.id,
        ...material,
      },
    })
  }
  console.log('Created course material costs:', courseMaterialCosts.length)

  // 创建全局设置
  const globalSettings = [
    { settingKey: 'default_sales_commission_rate', settingValue: '25', settingType: 'number', description: '默认销售分佣比例(%)' },
    { settingKey: 'qian_teacher_hourly_rate', settingValue: '200', settingType: 'number', description: '钱老师小时费率' },
  ]

  for (const setting of globalSettings) {
    await prisma.globalSetting.create({
      data: {
        userId: user.id,
        ...setting,
      },
    })
  }
  console.log('Created global settings:', globalSettings.length)

  console.log('Seed completed successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
