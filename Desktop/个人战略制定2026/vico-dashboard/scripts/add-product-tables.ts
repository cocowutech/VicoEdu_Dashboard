import { createClient } from '@libsql/client'

const client = createClient({
  url: process.env.TURSO_DATABASE_URL || '',
  authToken: process.env.TURSO_AUTH_TOKEN || '',
})

async function main() {
  console.log('Adding product_matrix_items and ai_product_ideas tables...')

  // Create product_matrix_items table
  await client.execute(`
    CREATE TABLE IF NOT EXISTS product_matrix_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      category TEXT NOT NULL,
      item_type TEXT NOT NULL,
      item_name TEXT NOT NULL,
      item_value TEXT,
      item_value2 TEXT,
      color_class TEXT,
      is_outsourced INTEGER DEFAULT 0,
      sort_order INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `)
  console.log('Created product_matrix_items table')

  // Create ai_product_ideas table
  await client.execute(`
    CREATE TABLE IF NOT EXISTS ai_product_ideas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      icon TEXT NOT NULL,
      color_theme TEXT NOT NULL,
      description TEXT NOT NULL,
      test_note TEXT NOT NULL,
      sort_order INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `)
  console.log('Created ai_product_ideas table')

  // Insert default exam hierarchy items
  const examItems = [
    { type: 'exam', name: 'KET', color: 'green', outsourced: 0, order: 1 },
    { type: 'exam', name: 'PET', color: 'green', outsourced: 0, order: 2 },
    { type: 'exam', name: '小托福', color: 'blue', outsourced: 0, order: 3 },
    { type: 'exam', name: 'FCE', color: 'blue', outsourced: 0, order: 4 },
    { type: 'exam', name: '托福', color: 'purple', outsourced: 0, order: 5 },
    { type: 'exam', name: 'SSAT', color: 'gray', outsourced: 1, order: 6 },
    { type: 'exam', name: 'SAT', color: 'gray', outsourced: 1, order: 7 },
  ]

  for (const item of examItems) {
    await client.execute({
      sql: `INSERT OR IGNORE INTO product_matrix_items (user_id, category, item_type, item_name, color_class, is_outsourced, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [1, 'exam_hierarchy', item.type, item.name, item.color, item.outsourced, item.order]
    })
  }
  console.log('Inserted exam hierarchy items')

  // Insert default live pricing items
  const livePricingItems = [
    { type: 'basic', name: '基础档', exams: 'KET / PET', price1: '¥600', price2: '¥300-400', color: 'green', order: 1 },
    { type: 'intermediate', name: '进阶档', exams: 'PET / 小托福 / FCE', price1: '¥800-1000', price2: '¥400-500', color: 'blue', order: 2 },
    { type: 'advanced', name: '高级档', exams: 'FCE / 托福', price1: '¥1000-1200', price2: '¥500-600', color: 'purple', order: 3 },
  ]

  for (const item of livePricingItems) {
    await client.execute({
      sql: `INSERT OR IGNORE INTO product_matrix_items (user_id, category, item_type, item_name, item_value, item_value2, color_class, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [1, 'live_pricing', item.type, item.exams, item.price1, item.price2, item.color, item.order]
    })
  }
  console.log('Inserted live pricing items')

  // Insert default AI product ideas
  const aiIdeas = [
    { title: 'AI备考教练', icon: '🎯', color: 'purple', desc: '学生可以通过AI问考试问题，获得即时答疑和练习推荐', test: '需测试：学生是否有需求？愿意付费吗？', order: 1 },
    { title: '智能学习报告', icon: '📊', color: 'blue', desc: '自动追踪学生进度，生成可视化报告给家长', test: '需测试：家长是否看重？能提高续费率吗？', order: 2 },
    { title: '自动化招生', icon: '🔄', color: 'green', desc: '从私信到入班全流程AI辅助，减少人工跟进', test: '需测试：转化率是否下降？体验是否OK？', order: 3 },
    { title: '公众号AI助手', icon: '📱', color: 'orange', desc: '基于你写的内容，AI自动回答家长问题', test: '已有基础：微信公众号智能体功能', order: 4 },
  ]

  for (const idea of aiIdeas) {
    await client.execute({
      sql: `INSERT OR IGNORE INTO ai_product_ideas (user_id, title, icon, color_theme, description, test_note, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [1, idea.title, idea.icon, idea.color, idea.desc, idea.test, idea.order]
    })
  }
  console.log('Inserted AI product ideas')

  console.log('Done!')
}

main().catch(console.error)
