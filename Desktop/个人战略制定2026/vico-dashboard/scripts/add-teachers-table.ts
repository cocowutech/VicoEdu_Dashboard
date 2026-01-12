import { createClient } from '@libsql/client'

const client = createClient({
  url: process.env.TURSO_DATABASE_URL || '',
  authToken: process.env.TURSO_AUTH_TOKEN || '',
})

async function main() {
  console.log('Adding teachers table to Turso...')

  // Create teachers table
  await client.execute(`
    CREATE TABLE IF NOT EXISTS teachers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL DEFAULT 1,
      name TEXT NOT NULL,
      hourly_rate REAL NOT NULL DEFAULT 0,
      is_self INTEGER NOT NULL DEFAULT 0,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `)
  console.log('Created teachers table')

  // Insert default Coco teacher
  await client.execute(`
    INSERT OR IGNORE INTO teachers (id, user_id, name, hourly_rate, is_self, is_active)
    VALUES (1, 1, 'Coco', 0, 1, 1)
  `)
  console.log('Inserted default Coco teacher')

  console.log('Done!')
}

main().catch(console.error)
