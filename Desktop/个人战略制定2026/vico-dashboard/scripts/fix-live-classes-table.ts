import { createClient } from '@libsql/client'

const client = createClient({
  url: process.env.TURSO_DATABASE_URL || '',
  authToken: process.env.TURSO_AUTH_TOKEN || '',
})

async function main() {
  console.log('Checking live_classes table schema...')

  // Check table info
  const tableInfo = await client.execute(`PRAGMA table_info(live_classes)`)
  console.log('Current columns:', tableInfo.rows.map(r => r.name))

  // Drop and recreate the table with correct schema
  console.log('Dropping old table...')
  await client.execute(`DROP TABLE IF EXISTS live_classes`)

  console.log('Creating live_classes table with correct schema...')
  await client.execute(`
    CREATE TABLE live_classes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL DEFAULT 1,
      name TEXT NOT NULL DEFAULT '新班级',
      lesson_price_per_student REAL NOT NULL DEFAULT 700,
      student_count INTEGER NOT NULL DEFAULT 5,
      student_names TEXT,
      lesson_duration REAL NOT NULL DEFAULT 2,
      weekly_lessons INTEGER NOT NULL DEFAULT 2,
      teacher_id INTEGER,
      teacher_hourly_cost REAL NOT NULL DEFAULT 0,
      total_lessons INTEGER NOT NULL DEFAULT 15,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (teacher_id) REFERENCES teachers(id)
    )
  `)
  console.log('Created live_classes table')

  // Insert a default class
  await client.execute(`
    INSERT INTO live_classes (user_id, name, lesson_price_per_student, student_count, lesson_duration, weekly_lessons, teacher_id, total_lessons)
    VALUES (1, '示例班级', 700, 5, 2, 2, 1, 15)
  `)
  console.log('Inserted default live class')

  console.log('Done!')
}

main().catch(console.error)
