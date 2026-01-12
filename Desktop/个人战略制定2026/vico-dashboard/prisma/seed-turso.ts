import { createClient } from '@libsql/client'

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
})

async function seed() {
  console.log('Seeding Turso database...')

  // Create default user
  await client.execute(`
    INSERT INTO users (id, email, password_hash, name, created_at, updated_at)
    VALUES (1, 'vico@example.com', 'hashed_password', 'Vico Education', datetime('now'), datetime('now'))
  `)
  console.log('Created user')

  // Create goals
  const goals = [
    { goalType: 'recruitment', goalName: '小红书粉丝数', targetValue: 10000, currentValue: 1200, unit: '人' },
    { goalType: 'recruitment', goalName: '月度新增私信', targetValue: 100, currentValue: 45, unit: '条' },
    { goalType: 'content', goalName: '录播课学员数', targetValue: 50, currentValue: 28, unit: '人' },
    { goalType: 'financial', goalName: '月收入目标', targetValue: 50000, currentValue: 32000, unit: '元' },
  ]

  for (const goal of goals) {
    await client.execute({
      sql: `INSERT INTO goals (user_id, goal_type, goal_name, target_value, current_value, unit, period, status, created_at, updated_at)
            VALUES (1, ?, ?, ?, ?, ?, 'monthly', 'active', datetime('now'), datetime('now'))`,
      args: [goal.goalType, goal.goalName, goal.targetValue, goal.currentValue, goal.unit],
    })
  }
  console.log('Created goals')

  // Create weekly tracking
  const now = new Date()
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - now.getDay() + 1)
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6)

  await client.execute({
    sql: `INSERT INTO weekly_tracking (user_id, week_start, week_end, xhs_posts_target, xhs_posts_actual, new_followers_target, new_followers_actual, inquiries_target, inquiries_actual, trial_students_target, trial_students_actual, new_enrollments_target, new_enrollments_actual, revenue_target, revenue_actual, created_at, updated_at)
          VALUES (1, ?, ?, 4, 0, 50, 0, 10, 0, 5, 0, 3, 0, 10000, 0, datetime('now'), datetime('now'))`,
    args: [weekStart.toISOString(), weekEnd.toISOString()],
  })
  console.log('Created weekly tracking')

  // Create AI automations
  const aiTasks = [
    { taskName: '发现潜在客户', toolSuggestion: 'ChatGPT + 小红书API', priority: 5, status: 'pending' },
    { taskName: '内容创作辅助', toolSuggestion: 'Claude / ChatGPT', priority: 4, status: 'in_progress' },
    { taskName: '私信自动回复', toolSuggestion: '微信公众号智能体', priority: 4, status: 'pending' },
    { taskName: '学习进度追踪', toolSuggestion: 'Notion AI + 自动化', priority: 3, status: 'pending' },
    { taskName: '课程内容生成', toolSuggestion: 'Claude + Gamma', priority: 3, status: 'pending' },
  ]

  for (const task of aiTasks) {
    await client.execute({
      sql: `INSERT INTO ai_automations (user_id, task_name, tool_suggestion, priority, status, created_at, updated_at)
            VALUES (1, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
      args: [task.taskName, task.toolSuggestion, task.priority, task.status],
    })
  }
  console.log('Created AI automations')

  // Create commission rules (带直播)
  const commissionRulesWithLive = [
    { productType: 'with_live', minStudents: 1, maxStudents: 3, cocoRate: 35, zoeyRate: 32.5, echoRate: 32.5 },
    { productType: 'with_live', minStudents: 4, maxStudents: 8, cocoRate: 40, zoeyRate: 30, echoRate: 30 },
    { productType: 'with_live', minStudents: 9, maxStudents: null, cocoRate: 45, zoeyRate: 27.5, echoRate: 27.5 },
  ]

  for (const rule of commissionRulesWithLive) {
    await client.execute({
      sql: `INSERT INTO commission_rules (user_id, product_type, min_students, max_students, coco_rate, zoey_rate, echo_rate, created_at, updated_at)
            VALUES (1, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
      args: [rule.productType, rule.minStudents, rule.maxStudents, rule.cocoRate, rule.zoeyRate, rule.echoRate],
    })
  }

  // Create commission rules (不带直播)
  const commissionRulesWithoutLive = [
    { productType: 'without_live', minStudents: 1, maxStudents: 3, cocoRate: 30, zoeyRate: 35, echoRate: 35 },
    { productType: 'without_live', minStudents: 4, maxStudents: 8, cocoRate: 35, zoeyRate: 32.5, echoRate: 32.5 },
    { productType: 'without_live', minStudents: 9, maxStudents: null, cocoRate: 40, zoeyRate: 30, echoRate: 30 },
  ]

  for (const rule of commissionRulesWithoutLive) {
    await client.execute({
      sql: `INSERT INTO commission_rules (user_id, product_type, min_students, max_students, coco_rate, zoey_rate, echo_rate, created_at, updated_at)
            VALUES (1, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
      args: [rule.productType, rule.minStudents, rule.maxStudents, rule.cocoRate, rule.zoeyRate, rule.echoRate],
    })
  }
  console.log('Created commission rules')

  // Create course material costs
  const courseMaterials = [
    // 带直播课程
    { courseName: 'KET全程营(带直播)', retailPrice: 7800, materialCost: 100, hasLive: true, qianTeacherFee: 1200, salesCommissionRate: 40, sortOrder: 1 },
    { courseName: 'KET考冲营(带直播)', retailPrice: 4800, materialCost: 50, hasLive: true, qianTeacherFee: 800, salesCommissionRate: 40, sortOrder: 2 },
    { courseName: 'PET全程营(带直播)', retailPrice: 8800, materialCost: 120, hasLive: true, qianTeacherFee: 1200, salesCommissionRate: 40, sortOrder: 3 },
    { courseName: 'PET考冲营(带直播)', retailPrice: 5800, materialCost: 60, hasLive: true, qianTeacherFee: 800, salesCommissionRate: 40, sortOrder: 4 },
    { courseName: 'FCE全程营(带直播)', retailPrice: 12800, materialCost: 150, hasLive: true, qianTeacherFee: 1500, salesCommissionRate: 40, sortOrder: 5 },
    { courseName: 'FCE考冲营(带直播)', retailPrice: 9800, materialCost: 80, hasLive: true, qianTeacherFee: 1000, salesCommissionRate: 40, sortOrder: 6 },
    // 不带直播课程
    { courseName: 'KET全程营(不带直播)', retailPrice: 5800, materialCost: 100, hasLive: false, qianTeacherFee: 0, salesCommissionRate: 25, sortOrder: 7 },
    { courseName: 'KET考冲营(不带直播)', retailPrice: 3500, materialCost: 50, hasLive: false, qianTeacherFee: 0, salesCommissionRate: 25, sortOrder: 8 },
    { courseName: 'PET全程营(不带直播)', retailPrice: 6000, materialCost: 120, hasLive: false, qianTeacherFee: 0, salesCommissionRate: 25, sortOrder: 9 },
    { courseName: 'PET考冲营(不带直播)', retailPrice: 4500, materialCost: 60, hasLive: false, qianTeacherFee: 0, salesCommissionRate: 25, sortOrder: 10 },
    { courseName: 'FCE全程营(不带直播)', retailPrice: 7800, materialCost: 150, hasLive: false, qianTeacherFee: 0, salesCommissionRate: 25, sortOrder: 11 },
    { courseName: 'FCE考冲营(不带直播)', retailPrice: 4800, materialCost: 80, hasLive: false, qianTeacherFee: 0, salesCommissionRate: 25, sortOrder: 12 },
    { courseName: 'FCE教材部分(不带直播)', retailPrice: 3000, materialCost: 150, hasLive: false, qianTeacherFee: 0, salesCommissionRate: 25, sortOrder: 13 },
  ]

  for (const course of courseMaterials) {
    await client.execute({
      sql: `INSERT INTO course_material_costs (user_id, course_name, retail_price, material_cost, has_live, qian_teacher_fee, sales_commission_rate, sort_order, is_active, created_at, updated_at)
            VALUES (1, ?, ?, ?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))`,
      args: [course.courseName, course.retailPrice, course.materialCost, course.hasLive ? 1 : 0, course.qianTeacherFee, course.salesCommissionRate, course.sortOrder],
    })
  }
  console.log('Created course material costs')

  console.log('Seed completed!')
}

seed().catch(console.error)
